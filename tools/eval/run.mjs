// Replays the research corpus through the extension's real tagger and rule layer, per tier, and
// writes samples in the experiment's judged-item shape for research/experiment/judge.py.
// Usage: node tools/eval/run.mjs --corpus <corpus.jsonl> --lang es --out <dir> [--sample 200] [--ratio 33] [--seed 7]
//          [--verify claude --model sonnet --max-blocks 60]
// With --verify claude, the llm tier runs the extension's real verifier prompt through `claude -p`
// on up to --max-blocks random blocks, so the sample measures what that tier would paint.
// Writes: <out>/<lang>-<tier>.jsonl (samples to judge) and <out>/<lang>-density.json.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tagBlock } from '../../extension/src/weave/tag.js';
import { findCandidates } from '../../extension/src/weave/candidates.js';
import { countWords } from '../../extension/src/shared/text.js';
import { budgetFor, select, newState, DEFAULTS } from '../../extension/src/shared/schedule.js';
import { buildVerifyPrompt, parseVerdicts } from '../../extension/src/shared/prompt.js';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const lang = opt('lang', 'es');
const corpusPath = opt('corpus');
const outDir = opt('out');
const sampleN = Number(opt('sample', '200'));
const ratio = Number(opt('ratio', '33'));
let seed = Number(opt('seed', '7'));
const verifyWith = opt('verify', '');
const model = opt('model', 'sonnet');
const maxBlocks = Number(opt('max-blocks', '60'));
if (!corpusPath || !outDir) { console.error('need --corpus and --out'); process.exit(2); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pack = JSON.parse(readFileSync(path.join(root, 'extension/packs', `${lang}.json`), 'utf8'));
const docs = readFileSync(corpusPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
mkdirSync(outDir, { recursive: true });

const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const CLASS = { conn: 'CONN', adv: 'ADV', noun: 'NOUN', 'noun+adj': 'NOUN' };
const RULE = { conn: 'CONN-tok', adv: 'ADV-tok', noun: 'N-det', 'noun+adj': 'N-adj' };

// Runs the extension's verifier contract through `claude -p` for one block. Returns the accepted
// candidates with their chosen forms plus any extras, or null on failure (the chain would fall through).
function claudeVerify(sentences, candidates, learning) {
  const prompt = buildVerifyPrompt({ pack, sentences, candidates, learning });
  let text;
  try {
    text = execFileSync('claude', ['-p', prompt, '--model', model, '--output-format', 'text'], { encoding: 'utf8', timeout: 180000, maxBuffer: 1 << 22 });
  } catch (e) {
    console.error(`claude failed: ${String(e.message).slice(0, 120)}`);
    return null;
  }
  const r = parseVerdicts(text, { pack, sentences, candidates, learning });
  if (!r.ok) return null;
  const okById = new Map(r.verdicts.filter((v) => v.ok).map((v) => [v.id, v.form]));
  const accepted = candidates.filter((c) => okById.has(c.id)).map((c) => ({ ...c, form: okById.get(c.id) || c.form, verified: 'llm' }));
  return { accepted, extras: r.extras };
}

const density = {};
for (const tier of ['llm', 'translator', 'none']) {
  const items = [];
  let words = 0;
  let painted = 0;
  let verifiedBlocks = 0;
  let verifyFailures = 0;
  const allBlocks = [];
  for (const doc of docs) {
    const paragraphs = doc.text.split('\n').filter((p) => countWords(p) >= 4);
    paragraphs.forEach((text, pi) => allBlocks.push({ doc, pi, text }));
  }
  // With a model verifier only a random subset of blocks is affordable; density is reported on that subset.
  const verifying = tier === 'llm' && verifyWith === 'claude';
  const blocks = verifying ? [...allBlocks].sort(() => rand() - 0.5).slice(0, maxBlocks) : allBlocks;
  const states = new Map();
  const carries = new Map();
  for (const { doc, pi, text } of blocks) {
    if (!states.has(doc.id)) { states.set(doc.id, newState()); carries.set(doc.id, 0); }
    const state = states.get(doc.id);
    {
      const tagged = tagBlock(text);
      let cands = findCandidates(pack, tagged, text, { tier });
      const n = countWords(text);
      words += n;
      if (verifying && cands.length) {
        const sentencesText = tagged.sentences.map((s) => text.slice(s.start, s.end));
        const learning = Object.keys(pack.entries).filter((k) => ['noun', 'verb', 'adv', 'conn', 'adj'].includes(pack.entries[k].class)).slice(0, 0); // no learning set in the eval: extras are not measured
        const r = claudeVerify(sentencesText, cands, learning);
        if (!r) { verifyFailures++; cands = []; } else { verifiedBlocks++; cands = r.accepted; }
      }
      const b = budgetFor(n, ratio, carries.get(doc.id));
      carries.set(doc.id, b.carry);
      const chosen = select(state, pack, cands, { ...DEFAULTS, ratio, perSentence: true }, b.budget, '2026-10-16T10:00:00');
      painted += chosen.length;
      for (const c of cands) {
        const s = tagged.sentences[c.sentence];
        const sentence = text.slice(s.start, s.end);
        const start = c.start - s.start;
        const end = c.end - s.start;
        const e = pack.entries[c.key];
        items.push({
          cid: `${lang}-${tier}-${doc.id}-${pi}-${c.start}`,
          lang, tier, doc: doc.id, sid: `${doc.id}:${pi}:${c.sentence}`,
          sentence, start, end, english: sentence.slice(start, end), target: c.form,
          swapped: sentence.slice(0, start) + c.form + sentence.slice(end),
          lemma: c.lemma, pos: c.pos, class: CLASS[c.rule], rule: RULE[c.rule], pack_keys: c.keys,
          gloss: `${c.lemma} (${e.class}) = ${e.target}: ${e.sense}`,
          f2: c.dominant, needsVerifier: Boolean(c.needsVerifier), alternatives: c.alternatives || null,
        });
      }
    }
  }
  density[tier] = { words, candidates: items.length, painted, per100: Number(((painted / words) * 100).toFixed(2)), ratio, candidatesPer100: Number(((items.length / words) * 100).toFixed(2)), blocks: blocks.length, verifiedBlocks, verifyFailures, verifier: verifying ? `claude -p (${model})` : null };
  // Stratified-ish random sample by rule.
  const byRule = new Map();
  for (const it of items) { if (!byRule.has(it.rule)) byRule.set(it.rule, []); byRule.get(it.rule).push(it); }
  const sample = [];
  const per = Math.ceil(sampleN / byRule.size);
  for (const [, list] of byRule) {
    const shuffled = [...list].sort(() => rand() - 0.5);
    sample.push(...shuffled.slice(0, per));
  }
  writeFileSync(path.join(outDir, `${lang}-${tier}.jsonl`), sample.map((s) => JSON.stringify(s)).join('\n') + '\n');
  console.log(`${lang} ${tier}: ${items.length} candidates over ${words} words (${density[tier].candidatesPer100}/100), ${painted} painted at 1 in ${ratio} (${density[tier].per100}/100); sampled ${sample.length}`);
}
writeFileSync(path.join(outDir, `${lang}-density.json`), JSON.stringify(density, null, 2) + '\n');
