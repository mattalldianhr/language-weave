import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVerifyPrompt, parseVerdicts } from '../src/shared/prompt.js';

const pack = {
  lang: 'es', name: 'Spanish', revision: 't', blocklist: [], drop: [],
  entries: {
    'but|CONJ': { target: 'pero', sense: 'however', dominant: true, note: '', class: 'conn', tier: 1, rank: 20, forms: { word: 'pero' } },
    'question|NOUN': { target: 'pregunta', sense: 'something asked', dominant: true, note: '', class: 'noun', tier: 1, rank: 300, forms: { gender: 'f', sg: 'pregunta', pl: 'preguntas' } },
    'think|VERB': { target: 'pensar', sense: 'have an opinion', dominant: true, note: '', class: 'verb', tier: 2, rank: 120,
      forms: { inf: 'pensar', present: { '1sg': 'pienso', '2sg': 'piensas', '3sg': 'piensa', '1pl': 'pensamos', '2pl': 'pensáis', '3pl': 'piensan' } } },
    'long|ADV': { target: 'mucho tiempo', sense: 'for a long time', dominant: false, note: 'duration only', class: 'adv', tier: 2, rank: 150, forms: { word: 'mucho tiempo' } },
  },
};

const sentences = ['We think the question is hard, but we stayed.', 'It took long.'];
const candidates = [
  { id: 'c1', sentence: 0, start: 9, end: 21, english: 'the question', key: 'question|NOUN', form: 'la pregunta' },
  { id: 'c2', sentence: 0, start: 31, end: 34, english: 'but', key: 'but|CONJ', form: 'pero' },
  { id: 'c3', sentence: 1, start: 8, end: 12, english: 'long', key: 'long|ADV', form: 'mucho tiempo' },
];
const learning = ['question|NOUN', 'think|VERB', 'long|ADV'];

test('buildVerifyPrompt lists sentences, candidates with notes, and unproposed learning words', () => {
  const p = buildVerifyPrompt({ pack, sentences, candidates, learning });
  assert.match(p, /Spanish/);
  assert.match(p, /"c1"/);
  assert.match(p, /la pregunta/);
  assert.match(p, /duration only/);
  assert.match(p, /JSON/);
  const marker = 'Input (JSON):\n';
  const input = JSON.parse(p.slice(p.indexOf(marker) + marker.length));
  assert.deepEqual(input.extras_allowed.map((x) => x.key), ['think|VERB']); // proposed words are not offered again
  assert.ok(input.extras_allowed[0].forms.includes('pensamos'));
  assert.equal(input.candidates.length, 3);
  assert.equal(input.sentences.length, 2);
});

test('parseVerdicts maps ids, rejects missing ids, ignores unknown ids', () => {
  const text = '{"verdicts":[{"id":"c1","ok":true},{"id":"c3","ok":false,"why":"idiom"},{"id":"zz","ok":true}],"extras":[]}';
  const r = parseVerdicts(text, { pack, sentences, candidates, learning });
  assert.deepEqual(r.verdicts, [{ id: 'c1', ok: true }, { id: 'c2', ok: false }, { id: 'c3', ok: false }]);
  assert.deepEqual(r.extras, []);
  assert.equal(r.ok, true);
});

test('parseVerdicts accepts fenced JSON', () => {
  const text = '```json\n{"verdicts":[{"id":"c1","ok":true},{"id":"c2","ok":true},{"id":"c3","ok":true}],"extras":[]}\n```';
  const r = parseVerdicts(text, { pack, sentences, candidates, learning });
  assert.equal(r.verdicts.every((v) => v.ok), true);
});

test('parseVerdicts fails closed on malformed output', () => {
  const r = parseVerdicts('Sure! Here are the results: c1 ok, c2 ok', { pack, sentences, candidates, learning });
  assert.equal(r.ok, false);
  assert.equal(r.verdicts.every((v) => v.ok === false), true);
  assert.deepEqual(r.extras, []);
});

test('parseVerdicts keeps only extras that are learning words with a pack form found in the sentence', () => {
  const extras = [
    { sentence: 0, english: 'think', key: 'think|VERB', form: 'pensamos' }, // valid
    { sentence: 0, english: 'think', key: 'think|VERB', form: 'pensamiento' }, // form not in pack
    { sentence: 0, english: 'stayed', key: 'stay|VERB', form: 'quedamos' }, // not in pack or learning
    { sentence: 0, english: 'hard', key: 'but|CONJ', form: 'pero' }, // not a learning word
    { sentence: 1, english: 'think', key: 'think|VERB', form: 'pensamos' }, // english not in that sentence
    { sentence: 0, english: 'question', key: 'question|NOUN', form: 'pregunta' }, // overlaps accepted c1
  ];
  const text = JSON.stringify({ verdicts: [{ id: 'c1', ok: true }, { id: 'c2', ok: true }, { id: 'c3', ok: false }], extras });
  const r = parseVerdicts(text, { pack, sentences, candidates, learning });
  assert.deepEqual(r.extras, [{ sentence: 0, start: 3, end: 8, english: 'think', key: 'think|VERB', form: 'pensamos', extra: true }]);
});

test('parseVerdicts matches extras as whole words, case-insensitively', () => {
  const text = JSON.stringify({ verdicts: [{ id: 'c1', ok: true }, { id: 'c2', ok: true }, { id: 'c3', ok: true }], extras: [{ sentence: 0, english: 'Think', key: 'think|VERB', form: 'piensan' }] });
  const r = parseVerdicts(text, { pack, sentences, candidates, learning });
  assert.equal(r.extras.length, 1);
  assert.equal(r.extras[0].start, 3);
});
