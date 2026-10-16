// Deterministic candidate layer. Pure: takes a tagged block and a pack, returns candidates.
// Only the conservative configuration validated in research/experiment-deterministic.md:
// connectors, adverbs not dropped, article plus noun, article plus adjective plus noun.
// Verbs, bare nouns, predicative adjectives, and phrases never come from here.
import { lookup, nounPhrase } from '../shared/pack.js';
import { capLike } from '../shared/articles.js';
import { overlapsBlocklist } from '../shared/text.js';

const SIMPLE_DETS = new Set(['the', 'a', 'an']);
const COPULAS = new Set(['is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'become', 'becomes', 'became', 'seem', 'seems', 'seemed', 'remain', 'remains', 'remained']);
// English preposition -> German case it governs; null = two-way (accusative or dative).
const DE_PREP = {
  with: 'dat', for: 'acc', from: 'dat', about: 'acc', after: 'dat', before: 'dat', between: 'dat', at: 'dat',
  of: 'gen', into: 'acc', through: 'acc', without: 'acc', against: 'acc',
  during: 'gen', since: 'dat', among: 'dat', across: 'acc', despite: 'gen', within: 'dat',
  // two-way, or English prepositions whose German rendering varies by verb ("move to" = in + acc,
  // "central to" = für + acc, "by a process" = durch + acc): the verifier chooses
  in: null, on: null, over: null, under: null, behind: null, to: null, by: null,
};
// Connectors that must not open a sentence in a language: Romance languages say "Como / Comme /
// Siccome" for a causal opener, and "Aussi," / "Auch," do not mean "Furthermore,".
const NO_SENTENCE_START = { es: ['because'], fr: ['because', 'also'], it: ['because'], pt: ['because'], de: ['also'] };
const CASES = ['nom', 'acc', 'dat', 'gen'];

const ALPHA = /^\p{L}+(?:['’]\p{L}+)?$/u;
const CODE = /_|[a-z][A-Z]/;
const URLISH = /@|:\/\/|\.(com|org|net|io|edu|gov)\b/i;

function quoteSpans(text) {
  const spans = [];
  const straight = [...text.matchAll(/"/g)].map((m) => m.index);
  for (let i = 0; i + 1 < straight.length; i += 2) spans.push([straight[i], straight[i + 1] + 1]);
  if (straight.length % 2 === 1) spans.push([straight[straight.length - 1], text.length]);
  for (const m of text.matchAll(/“[^”]*(?:”|$)/gs)) spans.push([m.index, m.index + m[0].length]);
  for (const m of text.matchAll(/‘[^’]*(?:’|$)/gs)) spans.push([m.index, m.index + m[0].length]);
  return spans;
}

function titleRuns(tokens) {
  const out = new Set();
  const isCap = (t) => /^\p{Lu}/u.test(t.text) && ALPHA.test(t.text);
  let i = 0;
  while (i < tokens.length) {
    if (isCap(tokens[i])) {
      let j = i;
      while (j + 1 < tokens.length && tokens[j + 1].sentence === tokens[i].sentence && isCap(tokens[j + 1])) j++;
      if (j > i) for (let k = i; k <= j; k++) out.add(k);
      i = j + 1;
    } else i++;
  }
  return out;
}

function buildExclusions(tagged, text) {
  const quotes = quoteSpans(text);
  const titles = titleRuns(tagged.tokens);
  return (t) => {
    if (!ALPHA.test(t.text)) return 'non_alpha';
    if (t.pos === 'PROPN') return 'proper_noun';
    if (titles.has(t.i)) return 'title_run';
    const sentenceStart = tagged.sentences[t.sentence]?.start === t.start;
    if (/^\p{Lu}/u.test(t.text) && !sentenceStart && t.normal !== 'i') return 'capitalized_mid_sentence';
    if (t.pos === 'NUM' || URLISH.test(t.text)) return 'number_url';
    if (CODE.test(t.text)) return 'code_like';
    if (t.hyphenated) return 'hyphenated';
    if (quotes.some(([a, b]) => t.start >= a && t.end <= b)) return 'in_quote';
    return null;
  };
}

// German case for a noun phrase from surface cues. Returns {case} or {ambiguous: [cases]}.
function germanCase(tagged, phrase) {
  const first = phrase.det != null ? tagged.tokens[phrase.det] : tagged.tokens[phrase.adjs[0] ?? phrase.noun];
  const sentence = tagged.sentences[phrase.sentence];
  if (sentence && first.start === sentence.start) return { case: 'nom' };
  const prev = tagged.tokens[first.i - 1];
  if (!prev || prev.sentence !== phrase.sentence) return { ambiguous: CASES };
  if (prev.pos === 'ADP') {
    const c = DE_PREP[prev.normal];
    if (c === null) return { ambiguous: ['acc', 'dat'] };
    if (c) return { case: c };
    return { ambiguous: CASES };
  }
  if (prev.pos === 'AUX' || COPULAS.has(prev.normal)) return { case: 'nom' };
  if (prev.pos === 'VERB' && !prev.particle) return { case: 'acc' };
  return { ambiguous: CASES };
}

function adjacent(text, a, b) {
  return /^\s+$/.test(text.slice(a.end, b.start));
}

export function findCandidates(pack, tagged, text, settings = {}) {
  // Tiers: 'llm' takes every candidate (the model judges sense); 'translator' needs the
  // dominant-sense flag (the experiment's F3 = F2 + translation check) but can resolve listed
  // alternatives; 'none' needs the flag and never emits a candidate that needs a verifier.
  const tier = settings.tier || 'none';
  const dominantOnly = tier !== 'llm';
  const noVerifier = tier === 'none';
  const excluded = buildExclusions(tagged, text);
  const { tokens, phrases } = tagged;
  const out = [];
  const usedTokens = new Set();
  const blocklist = pack.blocklist || [];

  const push = (c) => {
    if (overlapsBlocklist(text, c.start, c.end, blocklist)) return;
    const dominant = c.entries.every((e) => e.dominant);
    if (noVerifier && c.needsVerifier) return;
    if (dominantOnly && !dominant) return;
    const { entries, ...rest } = c;
    out.push({ ...rest, dominant });
  };

  // Connectors and adverbs: single tokens. compromise tags some adverbs as conjunctions ("now"),
  // negatives ("never"), or adjectives ("together"), so the pack decides: a word with an ADV entry
  // and no competing ADJ entry is an adverb wherever the tagger put it, unless it sits in a noun phrase.
  const inPhraseBody = new Set();
  for (const p of phrases) {
    for (const a of p.adjs) inPhraseBody.add(a);
    for (const o of p.others) inPhraseBody.add(o);
  }
  for (const t of tokens) {
    if (excluded(t)) continue;
    if (t.pos === 'NOUN' || t.pos === 'VERB' || t.pos === 'PRON' || t.pos === 'DET' || t.pos === 'AUX' || t.pos === 'NUM') continue;
    const conn = lookup(pack, t.normal, 'CONJ');
    if (conn) {
      const sentenceStart = tagged.sentences[t.sentence]?.start === t.start;
      if (sentenceStart && (NO_SENTENCE_START[pack.lang] || []).includes(t.normal)) continue;
      usedTokens.add(t.i);
      push({ start: t.start, end: t.end, sentence: t.sentence, english: t.text, key: conn.key, keys: [conn.key], lemma: t.normal, pos: 'CONJ', form: capLike(t.text, conn.forms.word), rule: 'conn', entries: [conn] });
      continue;
    }
    if (t.degree || t.particle || t.phrasal || inPhraseBody.has(t.i)) continue;
    // "the only product", "the very idea": an adverb-tagged word right after a determiner is an
    // adjective in disguise.
    const prev = tokens[t.i - 1];
    if (prev && prev.pos === 'DET' && prev.sentence === t.sentence) continue;
    // "most often", "more likely", "less often": the degree word changes the target.
    if (prev && prev.sentence === t.sentence && ['most', 'more', 'less', 'least'].includes(prev.normal)) continue;
    const adv = lookup(pack, t.normal, 'ADV') || (t.pos === 'ADV' ? lookup(pack, t.lemma, 'ADV') : null);
    if (!adv) continue;
    if (t.pos !== 'ADV' && lookup(pack, t.normal, 'ADJ')) continue; // ambiguous without a tagger vote
    usedTokens.add(t.i);
    push({ start: t.start, end: t.end, sentence: t.sentence, english: t.text, key: adv.key, keys: [adv.key], lemma: t.normal, pos: 'ADV', form: capLike(t.text, adv.forms.word), rule: 'adv', entries: [adv] });
  }

  // Article plus noun, optionally with one adjective.
  for (const p of phrases) {
    if (p.det == null) continue;
    const det = tokens[p.det];
    const noun = tokens[p.noun];
    if (!SIMPLE_DETS.has(det.normal)) continue;
    if (noun.pos !== 'NOUN' || noun.possessive || excluded(noun)) continue;
    if (p.others.length || p.adjs.length > 1) continue;
    // "the political decision making", "the south bank holiday": a noun or gerund right after the
    // head continues a compound, so the phrase we would swap is not the real phrase.
    const next = tokens[noun.i + 1];
    if (next && next.sentence === noun.sentence && adjacent(text, noun, next) && (next.pos === 'NOUN' || next.tags.includes('Gerund'))) continue;
    const entry = lookup(pack, noun.lemma, 'NOUN');
    if (!entry) continue;
    const number = noun.number;
    const definite = det.normal === 'the' ? 'def' : 'indef';
    if (definite === 'indef' && number === 'pl') continue;
    let adjective = null;
    let adjToken = null;
    if (p.adjs.length === 1) {
      adjToken = tokens[p.adjs[0]];
      if (adjToken.degree || excluded(adjToken)) continue;
      adjective = lookup(pack, adjToken.lemma, 'ADJ') || lookup(pack, adjToken.normal, 'ADJ');
      if (!adjective) continue;
      if (!adjacent(text, det, adjToken) || !adjacent(text, adjToken, noun)) continue;
    } else if (!adjacent(text, det, noun)) continue;

    const base = { start: det.start, end: noun.end, sentence: noun.sentence, english: text.slice(det.start, noun.end), key: entry.key, keys: adjective ? [entry.key, adjective.key] : [entry.key], lemma: noun.lemma, pos: 'NOUN', rule: adjective ? 'noun+adj' : 'noun', entries: adjective ? [entry, adjective] : [entry] };
    const build = (kase) => {
      const np = nounPhrase(pack, entry, { number, definite, case: kase, adjective });
      return np == null ? null : capLike(det.text, np);
    };
    if (pack.lang !== 'de') {
      const form = build('nom');
      if (form) push({ ...base, form });
      continue;
    }
    // German noun phrases always go through a verifier: the case depends on the verb or
    // preposition, and surface cues alone judged below the bar (plan §Results, 2026-10-16).
    // The cue's guess goes first so a form-checking verifier tries it before the others.
    const gc = germanCase(tagged, p);
    const order = gc.case ? [gc.case, ...CASES.filter((c) => c !== gc.case)] : gc.ambiguous.concat(CASES.filter((c) => !gc.ambiguous.includes(c)));
    const alternatives = [...new Set(order.map(build).filter(Boolean))];
    if (!alternatives.length) continue;
    push({ ...base, form: alternatives[0], alternatives, needsVerifier: true, case: gc.case || null });
  }

  out.sort((a, b) => a.start - b.start);
  out.forEach((c, i) => { c.id = `c${i + 1}`; });
  return out;
}
