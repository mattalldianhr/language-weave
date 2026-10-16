import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePack, lookup, formsOf, nounPhrase, adjectiveForm, entryKey } from '../src/shared/pack.js';

const es = {
  lang: 'es',
  name: 'Spanish',
  revision: 'test.1',
  blocklist: ['a lot of'],
  drop: ['long|ADV'],
  entries: {
    'question|NOUN': {
      target: 'pregunta', sense: 'something asked', dominant: true, note: '', class: 'noun', tier: 1, rank: 300,
      forms: { gender: 'f', sg: 'pregunta', pl: 'preguntas' },
    },
    'but|CONJ': { target: 'pero', sense: 'however', dominant: true, note: '', class: 'conn', tier: 1, rank: 20, forms: { word: 'pero' } },
    'long|ADV': { target: 'mucho tiempo', sense: 'for a long time', dominant: false, note: 'x', class: 'adv', tier: 2, rank: 150, forms: { word: 'mucho tiempo' } },
    'important|ADJ': {
      target: 'importante', sense: 'of great significance', dominant: true, note: '', class: 'adj', tier: 1, rank: 400,
      forms: { m_sg: 'importante', f_sg: 'importante', m_pl: 'importantes', f_pl: 'importantes', prenominal: false },
    },
    'big|ADJ': {
      target: 'grande', sense: 'large', dominant: true, note: '', class: 'adj', tier: 1, rank: 410,
      forms: { m_sg: 'grande', f_sg: 'grande', m_pl: 'grandes', f_pl: 'grandes', prenominal: true },
    },
    'think|VERB': {
      target: 'pensar', sense: 'have an opinion', dominant: true, note: '', class: 'verb', tier: 2, rank: 120,
      forms: { inf: 'pensar', present: { '1sg': 'pienso', '2sg': 'piensas', '3sg': 'piensa', '1pl': 'pensamos', '2pl': 'pensáis', '3pl': 'piensan' } },
    },
  },
};

const de = {
  lang: 'de', name: 'German', revision: 'test.1', blocklist: [], drop: [],
  entries: {
    'dog|NOUN': { target: 'Hund', sense: 'the animal', dominant: true, note: '', class: 'noun', tier: 1, rank: 900,
      forms: { gender: 'm', sg: 'Hund', pl: 'Hunde', gen_sg: 'Hundes', dat_pl: 'Hunden' } },
    'big|ADJ': { target: 'groß', sense: 'large', dominant: true, note: '', class: 'adj', tier: 1, rank: 410,
      forms: { base: 'groß', stem: 'groß', prenominal: true } },
  },
};

test('validatePack accepts the fixture and reports missing fields', () => {
  assert.deepEqual(validatePack(es), { ok: true, errors: [] });
  const bad = JSON.parse(JSON.stringify(es));
  delete bad.revision;
  delete bad.entries['but|CONJ'].target;
  bad.entries['question|NOUN'].class = 'thing';
  const r = validatePack(bad);
  assert.equal(r.ok, false);
  assert.equal(r.errors.length, 3);
});

test('lookup finds entries by lemma and POS and hides dropped ones', () => {
  assert.equal(lookup(es, 'question', 'NOUN').target, 'pregunta');
  assert.equal(lookup(es, 'Question', 'NOUN').target, 'pregunta');
  assert.equal(lookup(es, 'long', 'ADV'), null);
  assert.equal(lookup(es, 'nope', 'NOUN'), null);
  assert.equal(entryKey('Question', 'noun'), 'question|NOUN');
});

test('formsOf lists every surface form the verifier may accept', () => {
  const q = formsOf(es, lookup(es, 'question', 'NOUN'));
  for (const f of ['pregunta', 'preguntas', 'la pregunta', 'las preguntas', 'una pregunta', 'unas preguntas']) assert.ok(q.includes(f), f);
  const t = formsOf(es, lookup(es, 'think', 'VERB'));
  assert.ok(t.includes('pensamos'));
  assert.ok(t.includes('pensar'));
  const d = formsOf(de, lookup(de, 'dog', 'NOUN'));
  for (const f of ['der Hund', 'den Hund', 'dem Hund', 'des Hundes', 'die Hunde', 'den Hunden', 'ein Hund', 'einen Hund']) assert.ok(d.includes(f), f);
  const a = formsOf(de, lookup(de, 'big', 'ADJ'));
  for (const f of ['groß', 'große', 'großen', 'großer', 'großes', 'großem']) assert.ok(a.includes(f), f);
});

test('nounPhrase builds article plus noun with agreement and case', () => {
  const q = lookup(es, 'question', 'NOUN');
  assert.equal(nounPhrase(es, q, { number: 'sg', definite: 'def' }), 'la pregunta');
  assert.equal(nounPhrase(es, q, { number: 'pl', definite: 'indef' }), 'unas preguntas');
  const d = lookup(de, 'dog', 'NOUN');
  assert.equal(nounPhrase(de, d, { number: 'sg', definite: 'def', case: 'acc' }), 'den Hund');
  assert.equal(nounPhrase(de, d, { number: 'pl', definite: 'def', case: 'dat' }), 'den Hunden');
  assert.equal(nounPhrase(de, d, { number: 'sg', definite: 'def', case: 'gen' }), 'des Hundes');
  assert.equal(nounPhrase(de, d, { number: 'pl', definite: 'indef', case: 'nom' }), null);
});

test('German weak masculine nouns take -n in the accusative and dative singular', () => {
  const weak = { ...de, entries: { ...de.entries,
    'name|NOUN': { target: 'Name', sense: 'what something is called', dominant: true, note: '', class: 'noun', tier: 1, rank: 200,
      forms: { gender: 'm', sg: 'Name', pl: 'Namen', gen_sg: 'Namens', dat_pl: 'Namen' } },
    'person|NOUN': { target: 'Mensch', sense: 'human being', dominant: true, note: '', class: 'noun', tier: 1, rank: 210,
      forms: { gender: 'm', sg: 'Mensch', pl: 'Menschen', gen_sg: 'Menschen', dat_pl: 'Menschen' } },
  } };
  const name = lookup(weak, 'name', 'NOUN');
  assert.equal(nounPhrase(weak, name, { number: 'sg', definite: 'def', case: 'nom' }), 'der Name');
  assert.equal(nounPhrase(weak, name, { number: 'sg', definite: 'def', case: 'dat' }), 'dem Namen');
  assert.equal(nounPhrase(weak, name, { number: 'sg', definite: 'def', case: 'acc' }), 'den Namen');
  assert.equal(nounPhrase(weak, name, { number: 'sg', definite: 'def', case: 'gen' }), 'des Namens');
  const mensch = lookup(weak, 'person', 'NOUN');
  assert.equal(nounPhrase(weak, mensch, { number: 'sg', definite: 'indef', case: 'acc' }), 'einen Menschen');
  assert.equal(nounPhrase(weak, mensch, { number: 'sg', definite: 'def', case: 'nom' }), 'der Mensch');
  // strong nouns are untouched
  assert.equal(nounPhrase(weak, lookup(weak, 'dog', 'NOUN'), { number: 'sg', definite: 'def', case: 'dat' }), 'dem Hund');
  assert.ok(formsOf(weak, name).includes('den Namen'));
});

test('nounPhrase places an adjective with agreement, apocope, and German endings', () => {
  const q = lookup(es, 'question', 'NOUN');
  assert.equal(nounPhrase(es, q, { number: 'sg', definite: 'def', adjective: lookup(es, 'important', 'ADJ') }), 'la pregunta importante');
  assert.equal(nounPhrase(es, q, { number: 'sg', definite: 'indef', adjective: lookup(es, 'big', 'ADJ') }), 'una gran pregunta');
  assert.equal(nounPhrase(es, q, { number: 'pl', definite: 'def', adjective: lookup(es, 'big', 'ADJ') }), 'las grandes preguntas');
  const d = lookup(de, 'dog', 'NOUN');
  assert.equal(nounPhrase(de, d, { number: 'sg', definite: 'def', case: 'nom', adjective: lookup(de, 'big', 'ADJ') }), 'der große Hund');
  assert.equal(nounPhrase(de, d, { number: 'sg', definite: 'indef', case: 'acc', adjective: lookup(de, 'big', 'ADJ') }), 'einen großen Hund');
});

test('adjectiveForm agrees with gender and number', () => {
  assert.equal(adjectiveForm(es, lookup(es, 'important', 'ADJ'), { gender: 'f', number: 'pl' }), 'importantes');
  assert.equal(adjectiveForm(de, lookup(de, 'big', 'ADJ'), { gender: 'f', number: 'sg', case: 'nom', article: 'indef' }), 'große');
});
