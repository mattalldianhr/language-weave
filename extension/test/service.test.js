import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeChrome } from './fake-chrome.js';
import { createService, DEFAULT_SETTINGS } from '../src/background/service.js';

const pack = { lang: 'es', name: 'Spanish', revision: 'r1', blocklist: [], drop: [], entries: {
  'but|CONJ': { target: 'pero', sense: 'however', dominant: true, note: '', class: 'conn', tier: 1, rank: 20, forms: { word: 'pero' } },
  'now|ADV': { target: 'ahora', sense: 'at this time', dominant: false, note: '', class: 'adv', tier: 3, rank: 60, forms: { word: 'ahora' } },
  'dog|NOUN': { target: 'perro', sense: 'animal', dominant: true, note: '', class: 'noun', tier: 2, rank: 900, forms: { gender: 'm', sg: 'perro', pl: 'perros' } },
  'cat|NOUN': { target: 'gato', sense: 'animal', dominant: true, note: '', class: 'noun', tier: 2, rank: 950, forms: { gender: 'm', sg: 'gato', pl: 'gatos' } },
} };

function providers({ nano = 'unavailable', translator = 'unavailable', cloudVerify } = {}) {
  return {
    promptApi: { name: 'prompt-api', availability: async () => nano, verify: async (req) => ({ ok: true, verdicts: req.candidates.map((c) => ({ id: c.id, ok: true })), extras: [] }) },
    translator: { name: 'translator', availability: async () => translator, verify: async (req) => ({ ok: true, verdicts: req.candidates.map((c) => ({ id: c.id, ok: true })), extras: [] }) },
    cloud: (cfg) => ({ name: cfg.provider, origin: 'https://api.example/*', availability: async () => (cfg.key ? 'available' : 'unavailable'), verify: cloudVerify || (async (req) => ({ ok: true, verdicts: req.candidates.map((c) => ({ id: c.id, ok: true })), extras: [] })) }),
  };
}

const NOW = '2026-10-16T10:00:00';
async function boot(opts = {}) {
  const chrome = fakeChrome();
  const svc = createService({ chrome, providers: providers(opts), loadPack: async () => pack, now: () => new Date(opts.now || NOW) });
  await svc.init();
  return { chrome, svc };
}
const sender = { tab: { id: 1 }, url: 'https://news.example/a' };

test('init protects storage, writes default settings, and schedules the daily alarm', async () => {
  const { chrome } = await boot();
  assert.equal(chrome.storage.local.accessLevel, 'TRUSTED_CONTEXTS');
  assert.deepEqual(chrome._store.settings, DEFAULT_SETTINGS);
  assert.equal(chrome._alarms[0].name, 'daily');
});

test('config reflects global, site, route, and sensitive rules and resolves the tier', async () => {
  const { svc } = await boot({ translator: 'available' });
  let c = await svc.handle({ type: 'config', url: 'https://news.example/a' }, sender);
  assert.equal(c.enabled, true);
  assert.equal(c.tier, 'translator');
  assert.equal(c.lang, 'es');
  assert.equal(c.revision, 'r1');
  assert.equal(c.ratio, 33);
  c = await svc.handle({ type: 'config', url: 'https://news.example/checkout' }, sender);
  assert.equal(c.enabled, false);
  c = await svc.handle({ type: 'config', url: 'https://www.webmd.com/x' }, sender);
  assert.equal(c.enabled, false);
  await svc.handle({ type: 'site', url: 'https://news.example/a', enabled: false }, {});
  c = await svc.handle({ type: 'config', url: 'https://news.example/a' }, sender);
  assert.equal(c.enabled, false);
  await svc.handle({ type: 'toggle' }, {});
  c = await svc.handle({ type: 'config', url: 'https://blog.example/b' }, sender);
  assert.equal(c.enabled, false);
});

test('tier: on-device model first, then a configured cloud key, then translator, then none', async () => {
  let s = await boot({ nano: 'available', translator: 'available' });
  assert.equal((await s.svc.handle({ type: 'config', url: 'https://a.example/' }, sender)).tier, 'llm');
  s = await boot({ translator: 'available' });
  await s.svc.handle({ type: 'settings', patch: { cloud: { provider: 'anthropic' } } }, {});
  await s.svc.handle({ type: 'setKey', key: 'k-1' }, {});
  assert.equal((await s.svc.handle({ type: 'config', url: 'https://a.example/' }, sender)).tier, 'llm');
  assert.equal(s.chrome._store.cloudKey, 'k-1');
  assert.equal(s.chrome._store.settings.cloud.provider, 'anthropic');
  assert.equal(JSON.stringify(s.chrome._store.settings).includes('k-1'), false, 'key is never in settings');
  s = await boot();
  assert.equal((await s.svc.handle({ type: 'config', url: 'https://a.example/' }, sender)).tier, 'none');
  await s.svc.handle({ type: 'settings', patch: { tier: 'none' } }, {});
  s = await boot({ nano: 'available' });
  await s.svc.handle({ type: 'settings', patch: { tier: 'none' } }, {});
  assert.equal((await s.svc.handle({ type: 'config', url: 'https://a.example/' }, sender)).tier, 'none');
});

const text = 'But the dog sleeps now. The cat eats. But why? The dog barks.';
const sentences = [{ start: 0, end: 23 }, { start: 24, end: 37 }, { start: 38, end: 46 }, { start: 47, end: 61 }];
const candidates = [
  { id: 'c1', sentence: 0, start: 0, end: 3, english: 'But', key: 'but|CONJ', keys: ['but|CONJ'], form: 'Pero', dominant: true, rule: 'conn' },
  { id: 'c2', sentence: 0, start: 4, end: 11, english: 'the dog', key: 'dog|NOUN', keys: ['dog|NOUN'], form: 'el perro', dominant: true, rule: 'noun' },
  { id: 'c3', sentence: 0, start: 19, end: 22, english: 'now', key: 'now|ADV', keys: ['now|ADV'], form: 'ahora', dominant: false, rule: 'adv' },
  { id: 'c4', sentence: 1, start: 24, end: 31, english: 'The cat', key: 'cat|NOUN', keys: ['cat|NOUN'], form: 'El gato', dominant: true, rule: 'noun' },
  { id: 'c5', sentence: 2, start: 38, end: 41, english: 'But', key: 'but|CONJ', keys: ['but|CONJ'], form: 'Pero', dominant: true, rule: 'conn' },
  { id: 'c6', sentence: 3, start: 47, end: 54, english: 'The dog', key: 'dog|NOUN', keys: ['dog|NOUN'], form: 'El perro', dominant: true, rule: 'noun' },
];

test('verify: honours the density budget exactly, fills the learning set, and marks first encounters', async () => {
  const { svc, chrome } = await boot();
  const req = { type: 'verify', url: 'https://news.example/a', pageKey: 'p1', blockId: 'b1', text, sentences, words: 66, candidates };
  let r = await svc.handle(req, sender);
  assert.equal(r.tier, 'none');
  assert.equal(r.swaps.length, 2, 'floor(66/33) = 2');
  for (const s of r.swaps) {
    assert.equal(s.first, true);
    assert.equal(typeof s.sense, 'string');
    assert.ok(['but|CONJ', 'dog|NOUN', 'cat|NOUN'].includes(s.key), 'non-dominant never paints in the none tier');
  }
  const state = chrome._store['state:es'];
  assert.equal(Object.values(state.words).filter((w) => w.status === 'learning').length, 3, 'perDay default is 3');
  await svc.handle({ type: 'settings', patch: { ratio: 11 } }, {});
  r = await svc.handle({ ...req, pageKey: 'p2' }, sender);
  assert.equal(r.swaps.length, 3, 'floor(66/11) = 6, capped by one per sentence and one per word: but, dog, cat');
  await svc.handle({ type: 'settings', patch: { ratio: 11, perSentence: false } }, {});
  r = await svc.handle({ ...req, pageKey: 'p3' }, sender);
  assert.equal(r.swaps.length, 3, 'one swap per word per block');
  await svc.handle({ type: 'settings', patch: { ratio: 100 } }, {});
  r = await svc.handle({ ...req, pageKey: 'p4' }, sender);
  assert.equal(r.swaps.length, 0);
  r = await svc.handle({ ...req, pageKey: 'p4', blockId: 'b2' }, sender);
  assert.equal(r.swaps.length, 1, 'carry across blocks of the same page');
});

test('verify: the llm tier takes non-dominant candidates and counts cloud quota', async () => {
  const { svc } = await boot({ translator: 'unavailable' });
  await svc.handle({ type: 'settings', patch: { cloud: { provider: 'gemini' }, cloudLimit: 1, ratio: 1, perSentence: false } }, {});
  await svc.handle({ type: 'setKey', key: 'g' }, {});
  const req = { type: 'verify', url: 'https://news.example/a', pageKey: 'p', blockId: 'b', text, sentences, words: 66, candidates };
  let r = await svc.handle(req, sender);
  assert.equal(r.tier, 'llm');
  assert.ok(r.swaps.some((s) => s.key === 'now|ADV'));
  const st = await svc.handle({ type: 'state' }, {});
  assert.equal(st.quota.cloud.used, 1);
  assert.equal(st.quota.cloud.limit, 1);
  r = await svc.handle({ ...req, blockId: 'b2', text: 'Now now.', sentences: [{ start: 0, end: 8 }], words: 2, candidates: [{ id: 'c1', sentence: 0, start: 0, end: 3, english: 'Now', key: 'now|ADV', keys: ['now|ADV'], form: 'Ahora', dominant: false, rule: 'adv' }] }, sender);
  assert.equal(r.tier, 'none', 'quota exhausted falls to the floor');
});

test('events update the word state and the popup summary; untrusted senders are ignored', async () => {
  const { svc, chrome } = await boot();
  const req = { type: 'verify', url: 'https://news.example/a', pageKey: 'p', blockId: 'b', text, sentences, words: 66, candidates };
  const r = await svc.handle(req, sender);
  const key = r.swaps[0].key;
  await svc.handle({ type: 'event', key, event: 'seen' }, sender);
  await svc.handle({ type: 'event', key, event: 'peek' }, sender);
  const st = await svc.handle({ type: 'state' }, {});
  assert.equal(st.summary.today[0].key, key);
  assert.equal(chrome._store['state:es'].words[key].lastPeek, '2026-10-16');
  await svc.handle({ type: 'event', key, event: 'flip' }, sender);
  assert.equal(chrome._store['state:es'].words[key].status, 'shaky');
  const ignored = await svc.handle({ type: 'event', key, event: 'flip' }, { url: 'https://evil.example' });
  assert.equal(ignored.ok, false);
});

test('toggle and settings bump the generation and notify every tab', async () => {
  const { svc, chrome } = await boot();
  const g0 = (await svc.handle({ type: 'config', url: 'https://a.example/' }, sender)).generation;
  await svc.handle({ type: 'toggle' }, {});
  const g1 = (await svc.handle({ type: 'config', url: 'https://a.example/' }, sender)).generation;
  assert.ok(g1 > g0);
  assert.equal(chrome._sent.length, 2);
  assert.equal(chrome._sent[0].msg.type, 'config-changed');
  await svc.onCommand('toggle');
  assert.equal(chrome._store.settings.enabled, true);
});

test('seed marks known words; export omits the key; the daily alarm promotes', async () => {
  const { svc, chrome } = await boot();
  await svc.handle({ type: 'setKey', key: 'secret' }, {});
  await svc.handle({ type: 'seed', n: 2 }, {});
  let st = await svc.handle({ type: 'state' }, {});
  assert.equal(st.summary.known, 2);
  const ex = await svc.handle({ type: 'export' }, {});
  assert.equal(JSON.stringify(ex).includes('secret'), false);
  assert.ok(ex.states['state:es']);
  chrome._store['state:es'].words['dog|NOUN'] = { status: 'shaky', added: '2026-10-01', days: {}, encounters: 12, lastFlip: '2026-10-01', changed: '2026-10-01' };
  svc.invalidate();
  await svc.onAlarm('daily');
  st = await svc.handle({ type: 'state' }, {});
  assert.equal(chrome._store['state:es'].words['dog|NOUN'].status, 'known');
});
