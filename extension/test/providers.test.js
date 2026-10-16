import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTranslatorProvider } from '../src/providers/translator.js';
import { createPromptApiProvider } from '../src/providers/prompt-api.js';
import { createCloudProvider } from '../src/providers/cloud.js';
import { quotaState, quotaAllow, quotaRecord, quotaCount } from '../src/shared/quota.js';

const pack = {
  lang: 'es', name: 'Spanish', revision: 't', blocklist: [], drop: [],
  entries: {
    'question|NOUN': { target: 'pregunta', sense: 'something asked', dominant: true, note: '', class: 'noun', tier: 1, rank: 300, forms: { gender: 'f', sg: 'pregunta', pl: 'preguntas' } },
    'but|CONJ': { target: 'pero', sense: 'however', dominant: true, note: '', class: 'conn', tier: 1, rank: 20, forms: { word: 'pero' } },
    'long|ADV': { target: 'mucho tiempo', sense: 'for a long time', dominant: false, note: '', class: 'adv', tier: 2, rank: 150, forms: { word: 'mucho tiempo' } },
  },
};
const de = {
  lang: 'de', name: 'German', revision: 't', blocklist: [], drop: [],
  entries: { 'dog|NOUN': { target: 'Hund', sense: 'the animal', dominant: true, note: '', class: 'noun', tier: 2, rank: 900, forms: { gender: 'm', sg: 'Hund', pl: 'Hunde', gen_sg: 'Hundes', dat_pl: 'Hunden' } } },
};

function fakeTranslator(map) {
  const created = [];
  return {
    created,
    availability: async ({ targetLanguage }) => (targetLanguage === 'es' || targetLanguage === 'de' ? 'available' : 'unavailable'),
    create: async (opts) => { created.push(opts); return { translate: async (s) => map[s] ?? '' }; },
  };
}

test('translator: availability maps API states and missing globals', async () => {
  assert.equal(await createTranslatorProvider({ Translator: undefined }).availability('es'), 'unavailable');
  assert.equal(await createTranslatorProvider({ Translator: fakeTranslator({}) }).availability('es'), 'available');
  assert.equal(await createTranslatorProvider({ Translator: fakeTranslator({}) }).availability('xx'), 'unavailable');
  assert.equal(await createTranslatorProvider({ Translator: { availability: async () => 'downloading' } }).availability('es'), 'downloadable');
});

test('translator: accepts a candidate only when a pack form appears as a whole token in the translation', async () => {
  const sentences = ['The question stayed long, but nobody answered.'];
  const T = fakeTranslator({ [sentences[0]]: 'La pregunta se quedó mucho tiempo, pero nadie respondió.' });
  const p = createTranslatorProvider({ Translator: T });
  const candidates = [
    { id: 'c1', sentence: 0, start: 0, end: 12, english: 'The question', key: 'question|NOUN', keys: ['question|NOUN'], form: 'La pregunta' },
    { id: 'c2', sentence: 0, start: 20, end: 24, english: 'long', key: 'long|ADV', keys: ['long|ADV'], form: 'mucho tiempo' },
    { id: 'c3', sentence: 0, start: 26, end: 29, english: 'but', key: 'but|CONJ', keys: ['but|CONJ'], form: 'pero' },
  ];
  const r = await p.verify({ pack, sentences, candidates, learning: [] });
  assert.deepEqual(r.verdicts, [{ id: 'c1', ok: true }, { id: 'c2', ok: true }, { id: 'c3', ok: true }]);
  assert.deepEqual(r.extras, []);
  assert.equal(T.created.length, 1, 'one translator per language');
  const r2 = await p.verify({ pack, sentences: ['It is a question of time.'], candidates: [{ id: 'c1', sentence: 0, start: 8, end: 18, english: 'a question', key: 'question|NOUN', keys: ['question|NOUN'], form: 'una pregunta' }], learning: [] });
  assert.deepEqual(r2.verdicts, [{ id: 'c1', ok: false }], 'translation says "cuestión", not "pregunta"');
});

test('translator: German alternatives are chosen by the article phrase in the translation; compounds match by suffix', async () => {
  const s = ['He fed the dog in the house.', 'Coffee beans are roasted.'];
  const T = fakeTranslator({ [s[0]]: 'Er fütterte den Hund im Haus.', [s[1]]: 'Kaffeebohnen werden geröstet.' });
  const p = createTranslatorProvider({ Translator: T });
  const c = [{ id: 'c1', sentence: 0, start: 7, end: 14, english: 'the dog', key: 'dog|NOUN', keys: ['dog|NOUN'], form: 'der Hund', alternatives: ['der Hund', 'den Hund', 'dem Hund', 'des Hundes'], needsVerifier: true }];
  const r = await p.verify({ pack: de, sentences: s, candidates: c, learning: [] });
  assert.deepEqual(r.verdicts, [{ id: 'c1', ok: true, form: 'den Hund' }]);
  const bean = { ...de, entries: { 'bean|NOUN': { target: 'Bohne', sense: 'seed', dominant: true, note: '', class: 'noun', tier: 2, rank: 2000, forms: { gender: 'f', sg: 'Bohne', pl: 'Bohnen', gen_sg: 'Bohne', dat_pl: 'Bohnen' } } } };
  const r2 = await p.verify({ pack: bean, sentences: s, candidates: [{ id: 'c1', sentence: 1, start: 0, end: 12, english: 'Coffee beans', key: 'bean|NOUN', keys: ['bean|NOUN'], form: 'Bohnen' }], learning: [] });
  assert.deepEqual(r2.verdicts, [{ id: 'c1', ok: true }]);
});

test('translator: a failed translation throws so the chain can fall through', async () => {
  const p = createTranslatorProvider({ Translator: { availability: async () => 'available', create: async () => ({ translate: async () => { throw new Error('boom'); } }) } });
  await assert.rejects(p.verify({ pack, sentences: ['x'], candidates: [{ id: 'c1', sentence: 0, start: 0, end: 1, key: 'but|CONJ', keys: ['but|CONJ'], form: 'pero' }], learning: [] }));
});

test('prompt api: availability and a verify round trip through the prompt contract', async () => {
  const prompts = [];
  const LanguageModel = {
    availability: async () => 'available',
    create: async () => ({ prompt: async (text) => { prompts.push(text); return '{"verdicts":[{"id":"c1","ok":true}],"extras":[]}'; }, destroy() {} }),
  };
  const p = createPromptApiProvider({ LanguageModel });
  assert.equal(await p.availability(), 'available');
  assert.equal(await createPromptApiProvider({ LanguageModel: undefined }).availability(), 'unavailable');
  const r = await p.verify({ pack, sentences: ['But why?'], candidates: [{ id: 'c1', sentence: 0, start: 0, end: 3, english: 'But', key: 'but|CONJ', keys: ['but|CONJ'], form: 'Pero' }], learning: ['question|NOUN'] });
  assert.deepEqual(r.verdicts, [{ id: 'c1', ok: true }]);
  assert.match(prompts[0], /Spanish/);
  assert.match(prompts[0], /"c1"/);
});

test('prompt api: a quota error recreates the session once, then throws', async () => {
  let creates = 0;
  const LanguageModel = {
    availability: async () => 'available',
    create: async () => { creates++; return { prompt: async () => { const e = new Error('too big'); e.name = 'QuotaExceededError'; throw e; }, destroy() {} }; },
  };
  const p = createPromptApiProvider({ LanguageModel });
  await assert.rejects(p.verify({ pack, sentences: ['x'], candidates: [], learning: [] }));
  assert.equal(creates, 2);
});

function fakeFetch(reply, status = 200, headers = {}) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init: { ...init, body: JSON.parse(init.body) } });
    return { ok: status >= 200 && status < 300, status, headers: { get: (k) => headers[k.toLowerCase()] ?? null }, json: async () => reply, text: async () => JSON.stringify(reply) };
  };
  return { fetch, calls };
}
const req = { pack, sentences: ['But why?'], candidates: [{ id: 'c1', sentence: 0, start: 0, end: 3, english: 'But', key: 'but|CONJ', keys: ['but|CONJ'], form: 'Pero' }], learning: [] };
const good = '{"verdicts":[{"id":"c1","ok":true}],"extras":[]}';

test('cloud: anthropic request and response shape', async () => {
  const f = fakeFetch({ content: [{ type: 'text', text: good }] });
  const p = createCloudProvider({ provider: 'anthropic', key: 'k-test', fetch: f.fetch });
  assert.equal(await p.availability(), 'available');
  const r = await p.verify(req);
  assert.deepEqual(r.verdicts, [{ id: 'c1', ok: true }]);
  assert.equal(f.calls[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(f.calls[0].init.headers['x-api-key'], 'k-test');
  assert.equal(f.calls[0].init.headers['anthropic-dangerous-direct-browser-access'], 'true');
  assert.equal(f.calls[0].init.body.messages[0].role, 'user');
  assert.match(f.calls[0].init.body.model, /claude/);
});

test('cloud: gemini request and response shape', async () => {
  const f = fakeFetch({ candidates: [{ content: { parts: [{ text: good }] } }] });
  const p = createCloudProvider({ provider: 'gemini', key: 'g-test', fetch: f.fetch });
  const r = await p.verify(req);
  assert.deepEqual(r.verdicts, [{ id: 'c1', ok: true }]);
  assert.match(f.calls[0].url, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/.+:generateContent$/);
  assert.equal(f.calls[0].init.headers['x-goog-api-key'], 'g-test');
  assert.equal(f.calls[0].init.body.contents[0].parts[0].text.includes('Spanish'), true);
});

test('cloud: openai-compatible request with a custom base URL and model', async () => {
  const f = fakeFetch({ choices: [{ message: { content: good } }] });
  const p = createCloudProvider({ provider: 'openai', key: 'o-test', baseUrl: 'https://llm.example.com/v1/', model: 'local-model', fetch: f.fetch });
  const r = await p.verify(req);
  assert.deepEqual(r.verdicts, [{ id: 'c1', ok: true }]);
  assert.equal(f.calls[0].url, 'https://llm.example.com/v1/chat/completions');
  assert.equal(f.calls[0].init.headers.authorization, 'Bearer o-test');
  assert.equal(f.calls[0].init.body.model, 'local-model');
});

test('cloud: no key means unavailable; 429 and 5xx surface as errors with retry hints', async () => {
  assert.equal(await createCloudProvider({ provider: 'anthropic', key: '', fetch: fakeFetch({}).fetch }).availability(), 'unavailable');
  const f429 = fakeFetch({ error: 'slow down' }, 429, { 'retry-after': '7' });
  await assert.rejects(createCloudProvider({ provider: 'anthropic', key: 'k', fetch: f429.fetch }).verify(req), (e) => e.status === 429 && e.retryAfterMs === 7000);
  const f500 = fakeFetch({ error: 'down' }, 503);
  await assert.rejects(createCloudProvider({ provider: 'gemini', key: 'k', fetch: f500.fetch }).verify(req), (e) => e.status === 503);
});

test('cloud: endpoint origin is exposed for the host permission request', () => {
  assert.equal(createCloudProvider({ provider: 'anthropic', key: 'k' }).origin, 'https://api.anthropic.com/*');
  assert.equal(createCloudProvider({ provider: 'openai', key: 'k', baseUrl: 'https://llm.example.com/v1' }).origin, 'https://llm.example.com/*');
});

test('quota counts per provider per local day and resets at midnight', () => {
  let s = quotaState();
  assert.equal(quotaAllow(s, 'cloud', 2, '2026-10-16T10:00:00'), true);
  s = quotaRecord(s, 'cloud', '2026-10-16T10:00:00');
  s = quotaRecord(s, 'cloud', '2026-10-16T11:00:00');
  assert.equal(quotaCount(s, 'cloud', '2026-10-16T12:00:00'), 2);
  assert.equal(quotaAllow(s, 'cloud', 2, '2026-10-16T12:00:00'), false);
  assert.equal(quotaAllow(s, 'nano', 2, '2026-10-16T12:00:00'), true);
  assert.equal(quotaAllow(s, 'cloud', 2, '2026-10-17T00:10:00'), true);
  assert.equal(quotaCount(s, 'cloud', '2026-10-17T00:10:00'), 0);
});
