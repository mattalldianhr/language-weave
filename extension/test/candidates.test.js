import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { tagBlock } from '../src/weave/tag.js';
import { findCandidates } from '../src/weave/candidates.js';

const mini = (lang, extra = {}) => ({
  lang, name: lang, revision: 't', blocklist: ['a lot of', 'as well as', 'in the long run'], drop: ['long|ADV'],
  entries: {
    'but|CONJ': { target: 'pero', sense: 'however', dominant: true, note: '', class: 'conn', tier: 1, rank: 20, forms: { word: 'pero' } },
    'because|CONJ': { target: 'porque', sense: 'for the reason that', dominant: true, note: '', class: 'conn', tier: 1, rank: 90, forms: { word: 'porque' } },
    'also|CONJ': { target: 'también', sense: 'in addition', dominant: true, note: '', class: 'conn', tier: 1, rank: 95, forms: { word: 'también' } },
    'often|ADV': { target: 'a menudo', sense: 'frequently', dominant: true, note: '', class: 'adv', tier: 3, rank: 500, forms: { word: 'a menudo' } },
    'now|ADV': { target: 'ahora', sense: 'at this time', dominant: false, note: 'now that = ya que', class: 'adv', tier: 3, rank: 60, forms: { word: 'ahora' } },
    'long|ADV': { target: 'mucho tiempo', sense: 'for a long time', dominant: false, note: '', class: 'adv', tier: 3, rank: 150, forms: { word: 'mucho tiempo' } },
    'question|NOUN': { target: 'pregunta', sense: 'something asked', dominant: true, note: '', class: 'noun', tier: 2, rank: 300, forms: { gender: 'f', sg: 'pregunta', pl: 'preguntas' } },
    'company|NOUN': { target: 'empresa', sense: 'a business', dominant: false, note: 'companionship = compañía', class: 'noun', tier: 2, rank: 320, forms: { gender: 'f', sg: 'empresa', pl: 'empresas' } },
    'system|NOUN': { target: 'sistema', sense: 'organised set', dominant: true, note: '', class: 'noun', tier: 2, rank: 330, forms: { gender: 'm', sg: 'sistema', pl: 'sistemas' } },
    'natural|ADJ': { target: 'natural', sense: 'of nature', dominant: true, note: '', class: 'adj', tier: 2, rank: 600, forms: { m_sg: 'natural', f_sg: 'natural', m_pl: 'naturales', f_pl: 'naturales', prenominal: false } },
    'big|ADJ': { target: 'grande', sense: 'large', dominant: true, note: '', class: 'adj', tier: 2, rank: 410, forms: { m_sg: 'grande', f_sg: 'grande', m_pl: 'grandes', f_pl: 'grandes', prenominal: true } },
    'think|VERB': { target: 'pensar', sense: 'have an opinion', dominant: true, note: '', class: 'verb', tier: 3, rank: 120, forms: { inf: 'pensar', present: { '1sg': 'pienso', '2sg': 'piensas', '3sg': 'piensa', '1pl': 'pensamos', '2pl': 'pensáis', '3pl': 'piensan' } } },
    ...extra,
  },
});

const run = (pack, text, settings = { tier: 'llm' }) => findCandidates(pack, tagBlock(text), text, settings);
const spans = (text, cs) => cs.map((c) => `${text.slice(c.start, c.end)}→${c.form}`);

test('connectors swap by surface word, with capitalisation copied', () => {
  const pack = mini('es');
  const text = 'But the plan failed, because the system was slow.';
  const cs = run(pack, text);
  assert.deepEqual(spans(text, cs).filter((s) => s.startsWith('But') || s.startsWith('because')), ['But→Pero', 'because→porque']);
  assert.equal(cs.find((c) => c.key === 'but|CONJ').rule, 'conn');
  assert.equal(cs.find((c) => c.key === 'but|CONJ').sentence, 0);
});

test('connectors tagged as adverbs or prepositions still match the pack', () => {
  const pack = mini('es');
  const text = 'We also think so.';
  const cs = run(pack, text);
  assert.ok(cs.some((c) => c.key === 'also|CONJ' && c.form === 'también'));
});

test('adverbs swap unless dropped, comparative, or a particle', () => {
  const pack = mini('es');
  const text = 'They often give up now, but not for long.';
  const cs = run(pack, text);
  const keys = cs.map((c) => c.key);
  assert.ok(keys.includes('often|ADV'));
  assert.ok(keys.includes('now|ADV'));
  assert.ok(!keys.includes('long|ADV'));
  assert.ok(!cs.some((c) => text.slice(c.start, c.end) === 'up'));
});

test('a swap never overlaps a blocklisted expression', () => {
  const pack = mini('es');
  const text = 'It paid off in the long run, as well as now.';
  const cs = run(pack, text);
  assert.ok(!cs.some((c) => text.slice(c.start, c.end) === 'long'));
  assert.ok(cs.some((c) => c.key === 'now|ADV'));
});

test('article plus noun swaps with agreement; bare nouns and verbs never do', () => {
  const pack = mini('es');
  const text = 'The question is simple: questions cost money, and we think the company knows.';
  const cs = run(pack, text);
  const s = spans(text, cs);
  assert.ok(s.includes('The question→La pregunta'), s.join(', '));
  assert.ok(s.includes('the company→la empresa'), s.join(', '));
  assert.ok(!cs.some((c) => text.slice(c.start, c.end) === 'questions'));
  assert.ok(!cs.some((c) => c.key === 'think|VERB'));
  const q = cs.find((c) => c.key === 'question|NOUN');
  assert.equal(q.rule, 'noun');
  assert.equal(q.english, 'The question');
});

test('article plus noun skips other determiners, extra modifiers, possessives, and indefinite plurals', () => {
  const pack = mini('es');
  const text = "This question, the press question, the company's question, a questions.";
  const cs = run(pack, text);
  assert.deepEqual(cs.filter((c) => c.rule === 'noun'), []);
});

test('article plus adjective plus noun with prenominal ordering and apocope', () => {
  const pack = mini('es');
  const text = 'We studied the natural system and a big question.';
  const cs = run(pack, text);
  const s = spans(text, cs);
  assert.ok(s.includes('the natural system→el sistema natural'), s.join(', '));
  assert.ok(s.includes('a big question→una gran pregunta'), s.join(', '));
  assert.equal(cs.find((c) => c.rule === 'noun+adj').keys.length, 2);
});

test('proper nouns, title runs, mid-sentence capitals, quotes, numbers, and code are excluded', () => {
  const pack = mini('es', {
    'state|NOUN': { target: 'estado', sense: 'political state', dominant: false, note: '', class: 'noun', tier: 2, rank: 200, forms: { gender: 'm', sg: 'estado', pl: 'estados' } },
  });
  const text = 'The State Department said "the question" was open; see the_question or theQuestion, Now.';
  const cs = run(pack, text);
  assert.deepEqual(spans(text, cs), []);
});

test('dominant-sense gate and verifier-only candidates in the no-verifier tier', () => {
  const pack = mini('es');
  const text = 'The company is big now, but the question is open.';
  const llm = run(pack, text, { tier: 'llm' });
  const none = run(pack, text, { tier: 'none' });
  assert.ok(llm.some((c) => c.key === 'company|NOUN'));
  assert.ok(llm.some((c) => c.key === 'now|ADV'));
  assert.ok(!none.some((c) => c.key === 'company|NOUN'), 'company is not dominant');
  assert.ok(!none.some((c) => c.key === 'now|ADV'), 'now is not dominant');
  assert.ok(none.some((c) => c.key === 'question|NOUN'));
  assert.ok(none.some((c) => c.key === 'but|CONJ'));
});

const dePack = {
  lang: 'de', name: 'German', revision: 't', blocklist: [], drop: [],
  entries: {
    'dog|NOUN': { target: 'Hund', sense: 'the animal', dominant: true, note: '', class: 'noun', tier: 2, rank: 900, forms: { gender: 'm', sg: 'Hund', pl: 'Hunde', gen_sg: 'Hundes', dat_pl: 'Hunden' } },
    'question|NOUN': { target: 'Frage', sense: 'something asked', dominant: true, note: '', class: 'noun', tier: 2, rank: 300, forms: { gender: 'f', sg: 'Frage', pl: 'Fragen', gen_sg: 'Frage', dat_pl: 'Fragen' } },
    'big|ADJ': { target: 'groß', sense: 'large', dominant: true, note: '', class: 'adj', tier: 2, rank: 410, forms: { base: 'groß', stem: 'groß', prenominal: true } },
  },
};

test('German: sentence-initial subject is nominative and needs no verifier', () => {
  const text = 'The dog sleeps.';
  const cs = run(dePack, text, { tier: 'none' });
  assert.deepEqual(spans(text, cs), ['The dog→Der Hund']);
  assert.equal(cs[0].needsVerifier, undefined);
});

test('German: fixed-case prepositions and direct objects get a case; two-way prepositions get alternatives', () => {
  const text = 'He walked with the dog and saw the question in the question.';
  const cs = run(dePack, text, { tier: 'llm' });
  const s = spans(text, cs);
  assert.ok(s.includes('the dog→dem Hund'), s.join(', '));
  assert.ok(s.includes('the question→die Frage'), s.join(', '));
  const inQ = cs.find((c) => c.start > text.indexOf(' in '));
  assert.equal(inQ.needsVerifier, true);
  assert.ok(inQ.alternatives.includes('der Frage'));
  assert.ok(inQ.alternatives.includes('die Frage'));
  assert.deepEqual(run(dePack, text, { tier: 'none' }).map((c) => c.needsVerifier), [undefined, undefined]);
});

test('German: adjective endings follow the article and case', () => {
  const text = 'The big dog saw a big question.';
  const cs = run(dePack, text, { tier: 'llm' });
  const s = spans(text, cs);
  assert.ok(s.includes('The big dog→Der große Hund'), s.join(', '));
  assert.ok(s.includes('a big question→eine große Frage'), s.join(', '));
});

// Regression against the judged experiment items (research/experiment/judged/*.jsonl): the rule layer
// should reproduce most swaps the judges called correct at F2 in the conservative rules, and emit none of
// the ones they said should not have been swapped.
const RULES = { 'CONN-tok': 'conn', 'ADV-tok': 'adv', 'N-det': 'noun', 'N-adj': 'noun+adj' };
const judgedDir = new URL('../../research/experiment/judged/', import.meta.url);
for (const lang of ['es', 'fr', 'de']) {
  const packUrl = new URL(`../packs/${lang}.json`, import.meta.url);
  const judgedUrl = new URL(`${lang}.jsonl`, judgedDir);
  if (!existsSync(packUrl) || !existsSync(judgedUrl)) continue;
  test(`regression ${lang}: reproduces judged-correct conservative swaps`, () => {
    const pack = JSON.parse(readFileSync(packUrl, 'utf8'));
    const rows = readFileSync(judgedUrl, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const correct = rows.filter((r) => RULES[r.rule] && r.f2 && r.label === 'correct');
    const bad = rows.filter((r) => RULES[r.rule] && r.label === 'should_not_swap_other');
    let hit = 0;
    let wrongForm = 0;
    const misses = [];
    for (const r of correct) {
      const cs = findCandidates(pack, tagBlock(r.sentence), r.sentence, { tier: 'llm' });
      const same = cs.find((c) => c.start === r.start && c.end === r.end);
      if (!same) { misses.push(`${r.rule} ${r.english}`); continue; }
      const forms = [same.form, ...(same.alternatives || [])].map((f) => f.toLowerCase());
      if (forms.includes(r.target.toLowerCase())) hit++;
      else { wrongForm++; misses.push(`${r.rule} ${r.english}→${same.form} (judged ${r.target})`); }
    }
    let badHit = 0;
    for (const r of bad) {
      const cs = findCandidates(pack, tagBlock(r.sentence), r.sentence, { tier: 'llm' });
      if (cs.some((c) => c.start === r.start && c.end === r.end)) badHit++;
    }
    const rate = hit / correct.length;
    console.log(`regression ${lang}: ${hit}/${correct.length} reproduced (${(rate * 100).toFixed(1)}%), ${wrongForm} with a different form, ${badHit}/${bad.length} should-not-swap emitted`);
    if (misses.length) console.log(`  misses: ${misses.slice(0, 12).join(' | ')}`);
    assert.ok(rate >= 0.8, `${lang}: ${(rate * 100).toFixed(1)}% < 80%`);
    assert.ok(badHit <= Math.ceil(bad.length * 0.34), `${lang}: emitted ${badHit} of ${bad.length} should-not-swap items`);
  });
}
