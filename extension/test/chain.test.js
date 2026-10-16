import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLru } from '../src/background/cache.js';
import { createChain } from '../src/background/chain.js';

const pack = { lang: 'es', name: 'Spanish', revision: 'r1', blocklist: [], drop: [], entries: {
  'but|CONJ': { target: 'pero', sense: 'however', dominant: true, note: '', class: 'conn', tier: 1, rank: 20, forms: { word: 'pero' } },
  'now|ADV': { target: 'ahora', sense: 'at this time', dominant: false, note: '', class: 'adv', tier: 3, rank: 60, forms: { word: 'ahora' } },
  'dog|NOUN': { target: 'perro', sense: 'animal', dominant: true, note: '', class: 'noun', tier: 2, rank: 900, forms: { gender: 'm', sg: 'perro', pl: 'perros' } },
} };
const sentences = ['But now the dog sleeps.', 'Fine.'];
const cands = () => [
  { id: 'c1', sentence: 0, start: 0, end: 3, rel: 0, english: 'But', key: 'but|CONJ', keys: ['but|CONJ'], form: 'Pero', dominant: true },
  { id: 'c2', sentence: 0, start: 4, end: 7, rel: 4, english: 'now', key: 'now|ADV', keys: ['now|ADV'], form: 'ahora', dominant: false },
  { id: 'c3', sentence: 0, start: 8, end: 15, rel: 8, english: 'the dog', key: 'dog|NOUN', keys: ['dog|NOUN'], form: 'el perro', dominant: true, needsVerifier: true, alternatives: ['el perro', 'un perro'] },
];

function fakeProvider(name, fn) {
  const calls = [];
  return { name, calls, availability: async () => 'available', verify: async (req) => { calls.push(req); return fn(req); } };
}
const accept = (req, form) => ({ ok: true, verdicts: req.candidates.map((c) => ({ id: c.id, ok: true, ...(c.alternatives && form ? { form } : {}) })), extras: [] });

test('tier order: the first provider that succeeds wins; its results are used', async () => {
  const llm = fakeProvider('llm', (req) => accept(req, 'un perro'));
  const tr = fakeProvider('translator', (req) => accept(req));
  const chain = createChain({ cache: createLru(100) });
  const r = await chain.verify({ pack, sentences, candidates: cands(), learning: [], tiers: [{ name: 'llm', provider: llm }, { name: 'translator', provider: tr }] });
  assert.equal(r.tier, 'llm');
  assert.equal(tr.calls.length, 0);
  assert.deepEqual(r.accepted.map((c) => [c.id, c.form]), [['c1', 'Pero'], ['c2', 'ahora'], ['c3', 'un perro']]);
});

test('a failing tier falls through to the next; none is the floor', async () => {
  const llm = fakeProvider('llm', () => { throw new Error('down'); });
  const tr = fakeProvider('translator', (req) => ({ ok: true, verdicts: req.candidates.map((c) => ({ id: c.id, ok: c.id !== 'c2' })), extras: [] }));
  const chain = createChain({ cache: createLru(100) });
  let r = await chain.verify({ pack, sentences, candidates: cands(), learning: [], tiers: [{ name: 'llm', provider: llm }, { name: 'translator', provider: tr }] });
  assert.equal(r.tier, 'translator');
  assert.deepEqual(r.accepted.map((c) => c.id), ['c1']); // c2 rejected, c3 needs a chosen form the translator did not give
  const tr2 = fakeProvider('translator', () => { throw new Error('down too'); });
  const fresh = createChain({ cache: createLru(100) });
  r = await fresh.verify({ pack, sentences, candidates: cands(), learning: [], tiers: [{ name: 'llm', provider: llm }, { name: 'translator', provider: tr2 }] });
  assert.equal(r.tier, 'none');
  assert.deepEqual(r.accepted.map((c) => c.id), ['c1'], 'none keeps dominant, verifier-free candidates only');
});

test('verdicts are cached by revision, sentence, key, and offset; a full cache hit skips the provider', async () => {
  const llm = fakeProvider('llm', (req) => accept(req, 'el perro'));
  const cache = createLru(100);
  const chain = createChain({ cache });
  const tiers = [{ name: 'llm', provider: llm }];
  await chain.verify({ pack, sentences, candidates: cands(), learning: [], tiers });
  assert.equal(llm.calls.length, 1);
  const r = await chain.verify({ pack, sentences, candidates: cands(), learning: [], tiers });
  assert.equal(llm.calls.length, 1, 'served from cache');
  assert.equal(r.tier, 'cache');
  assert.deepEqual(r.accepted.map((c) => [c.id, c.form]), [['c1', 'Pero'], ['c2', 'ahora'], ['c3', 'el perro']]);
  // a new candidate in the same sentence calls the provider with only the uncached one
  const more = [...cands(), { id: 'c4', sentence: 1, start: 24, end: 28, rel: 0, english: 'Fine', key: 'but|CONJ', keys: ['but|CONJ'], form: 'Pero', dominant: true }];
  await chain.verify({ pack, sentences, candidates: more, learning: [], tiers });
  assert.equal(llm.calls.length, 2);
  assert.deepEqual(llm.calls[1].candidates.map((c) => c.id), ['c4']);
  // a different pack revision misses
  await chain.verify({ pack: { ...pack, revision: 'r2' }, sentences, candidates: cands(), learning: [], tiers });
  assert.equal(llm.calls.length, 3);
});

test('rejections are cached too, so a rejected swap is not re-asked', async () => {
  const llm = fakeProvider('llm', (req) => ({ ok: true, verdicts: req.candidates.map((c) => ({ id: c.id, ok: false })), extras: [] }));
  const chain = createChain({ cache: createLru(100) });
  const tiers = [{ name: 'llm', provider: llm }];
  await chain.verify({ pack, sentences, candidates: cands(), learning: [], tiers });
  const r = await chain.verify({ pack, sentences, candidates: cands(), learning: [], tiers });
  assert.equal(llm.calls.length, 1);
  assert.deepEqual(r.accepted, []);
});

test('extras from an LLM tier are returned and cached per sentence and learning set', async () => {
  const llm = fakeProvider('llm', (req) => ({ ok: true, verdicts: req.candidates.map((c) => ({ id: c.id, ok: true, ...(c.alternatives ? { form: 'el perro' } : {}) })), extras: [{ sentence: 0, start: 16, end: 22, english: 'sleeps', key: 'sleep|VERB', form: 'duerme', extra: true }] }));
  const chain = createChain({ cache: createLru(100) });
  const tiers = [{ name: 'llm', provider: llm }];
  const r = await chain.verify({ pack, sentences, candidates: cands(), learning: ['sleep|VERB'], tiers });
  const extra = r.accepted.find((c) => c.extra);
  assert.equal(extra.key, 'sleep|VERB');
  assert.equal(extra.start, 16, 'block offset = sentence offset + sentence start');
  const r2 = await chain.verify({ pack, sentences, candidates: cands(), learning: ['sleep|VERB'], tiers });
  assert.equal(llm.calls.length, 1);
  assert.ok(r2.accepted.some((c) => c.extra));
  await chain.verify({ pack, sentences, candidates: cands(), learning: ['sleep|VERB', 'dog|NOUN'], tiers });
  assert.equal(llm.calls.length, 2, 'a changed learning set re-asks for extras');
});

test('LRU evicts the oldest entries and round-trips through JSON', () => {
  const lru = createLru(3);
  lru.set('a', 1); lru.set('b', 2); lru.set('c', 3);
  lru.get('a');
  lru.set('d', 4);
  assert.equal(lru.has('b'), false);
  assert.equal(lru.has('a'), true);
  const copy = createLru(3);
  copy.fromJSON(lru.toJSON());
  assert.deepEqual([...copy.keys()], ['c', 'a', 'd']);
  assert.equal(copy.size, 3);
});
