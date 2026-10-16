// Background service: settings, keys, word state, quota, the verifier chain, and selection.
// Pure of chrome.* except through the injected `chrome` object, so it runs under node tests.
import { validatePack } from '../shared/pack.js';
import { DEFAULTS, newState, seedKnown, refill, record, promote, budgetFor, select, summary } from '../shared/schedule.js';
import { quotaState, quotaAllow, quotaRecord, quotaCount } from '../shared/quota.js';
import { siteEnabled, setSite, routeBlocked, sensitiveUrl } from '../shared/sites.js';
import { createLru } from './cache.js';
import { createChain } from './chain.js';

export const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  lang: 'es',
  ratio: 33, // one swap per this many running words; the reader may set any value >= 1
  perSentence: true,
  perDay: 3,
  tier: 'auto', // 'auto' | 'none'
  sites: { mode: 'all', allow: [], deny: [] },
  skipSensitive: true,
  cloud: { provider: '', model: '', baseUrl: '' },
  cloudLimit: 300,
});

const CACHE_MAX = 5000;
const AVAILABILITY_TTL_MS = 60000;
const EVENTS = new Set(['seen', 'peek', 'flip']);

export function createService({ chrome, providers = {}, loadPack, now = () => new Date() }) {
  const store = chrome.storage.local;
  let settings = { ...DEFAULT_SETTINGS };
  let cloudKey = '';
  let generation = 1;
  let quota = quotaState();
  const states = new Map(); // lang -> state
  const packs = new Map(); // lang -> pack
  const carries = new Map(); // page key -> density carry
  const cache = createLru(CACHE_MAX);
  const chain = createChain({ cache });
  let availability = { at: 0, tiers: null, name: 'none' };
  let saveCacheTimer = null;

  const nowIso = () => {
    const d = now();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  function mergeSettings(base, patch = {}) {
    const out = { ...base, ...patch };
    out.sites = { ...base.sites, ...(patch.sites || {}) };
    out.cloud = { ...base.cloud, ...(patch.cloud || {}) };
    out.ratio = Math.max(1, Math.floor(Number(out.ratio) || DEFAULT_SETTINGS.ratio));
    out.perDay = Math.min(DEFAULTS.maxPerDay, Math.max(1, Math.floor(Number(out.perDay) || DEFAULT_SETTINGS.perDay)));
    out.cloudLimit = Math.max(1, Math.floor(Number(out.cloudLimit) || DEFAULT_SETTINGS.cloudLimit));
    out.perSentence = Boolean(out.perSentence);
    out.enabled = Boolean(out.enabled);
    out.tier = out.tier === 'none' ? 'none' : 'auto';
    return out;
  }

  async function init() {
    if (store.setAccessLevel) await store.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
    const data = await store.get(['settings', 'cloudKey', 'generation', 'quota', 'cache']);
    settings = mergeSettings(DEFAULT_SETTINGS, data.settings || {});
    cloudKey = data.cloudKey || '';
    generation = Number(data.generation) || 1;
    quota = data.quota || quotaState();
    if (data.cache) cache.fromJSON(data.cache);
    await store.set({ settings, generation });
    await chrome.alarms.create('daily', { periodInMinutes: 60 });
  }

  async function bump() {
    generation += 1;
    availability = { at: 0, tiers: null, name: 'none' };
    await store.set({ generation });
    const tabs = await chrome.tabs.query({}).catch(() => []);
    await Promise.all(tabs.map((t) => chrome.tabs.sendMessage(t.id, { type: 'config-changed', generation }).catch(() => {})));
  }

  async function packFor(lang) {
    if (!packs.has(lang)) {
      const pack = await loadPack(lang);
      const v = validatePack(pack);
      if (!v.ok) throw new Error(`pack ${lang} invalid: ${v.errors.slice(0, 3).join('; ')}`);
      packs.set(lang, pack);
    }
    return packs.get(lang);
  }

  async function stateFor(lang) {
    if (!states.has(lang)) {
      const key = `state:${lang}`;
      const data = await store.get(key);
      states.set(lang, data[key] || newState());
    }
    return states.get(lang);
  }

  async function saveState(lang) {
    await store.set({ [`state:${lang}`]: states.get(lang) });
  }

  function scheduleCacheSave() {
    if (saveCacheTimer) return;
    saveCacheTimer = setTimeout(() => {
      saveCacheTimer = null;
      store.set({ cache: cache.toJSON() }).catch(() => {});
    }, 2000);
    if (typeof saveCacheTimer.unref === 'function') saveCacheTimer.unref();
  }

  function cloudProvider() {
    const { provider, model, baseUrl } = settings.cloud;
    if (!provider || !cloudKey || !providers.cloud) return null;
    return providers.cloud({ provider, key: cloudKey, model, baseUrl });
  }

  // Tiers in order, cached for a minute. 'llm' is the on-device model or a configured cloud key,
  // 'translator' the Translator API agreement check; the chain's floor is the rule layer.
  async function resolveTiers(lang) {
    if (settings.tier === 'none') return { name: 'none', tiers: [] };
    const fresh = availability.tiers && availability.lang === lang && Date.now() - availability.at < AVAILABILITY_TTL_MS;
    if (!fresh) {
      const tiers = [];
      const nano = providers.promptApi ? await providers.promptApi.availability() : 'unavailable';
      if (nano === 'available') tiers.push({ name: 'llm', provider: providers.promptApi, kind: 'nano' });
      else {
        const cloud = cloudProvider();
        if (cloud) tiers.push({ name: 'llm', provider: cloud, kind: 'cloud' });
      }
      const tr = providers.translator ? await providers.translator.availability(lang) : 'unavailable';
      if (tr === 'available') tiers.push({ name: 'translator', provider: providers.translator, kind: 'translator' });
      availability = { at: Date.now(), lang, tiers, nano, translator: tr };
    }
    const tiers = availability.tiers.filter((t) => t.kind !== 'cloud' || quotaAllow(quota, 'cloud', settings.cloudLimit, nowIso()));
    return { name: tiers[0]?.name || 'none', tiers };
  }

  function pageEnabled(url) {
    if (!settings.enabled) return { enabled: false, reason: 'off' };
    if (!siteEnabled(settings.sites, url)) return { enabled: false, reason: 'site' };
    if (routeBlocked(url)) return { enabled: false, reason: 'route' };
    if (settings.skipSensitive && sensitiveUrl(url)) return { enabled: false, reason: 'sensitive' };
    return { enabled: true, reason: '' };
  }

  async function config(url) {
    const page = pageEnabled(url || '');
    const pack = await packFor(settings.lang).catch(() => null);
    const { name: tier } = page.enabled ? await resolveTiers(settings.lang) : { name: 'none' };
    return {
      generation,
      enabled: page.enabled && Boolean(pack),
      reason: pack ? page.reason : 'pack',
      lang: settings.lang,
      revision: pack?.revision || '',
      tier,
      ratio: settings.ratio,
      perSentence: settings.perSentence,
    };
  }

  async function verify(msg, sender) {
    const page = pageEnabled(msg.url || sender?.url || '');
    if (!page.enabled) return { generation, tier: 'none', swaps: [] };
    const lang = settings.lang;
    const pack = await packFor(lang);
    const state = await stateFor(lang);
    const { name: tierName, tiers } = await resolveTiers(lang);
    const classes = tierName === 'llm' ? [...DEFAULTS.classes, 'verb'] : DEFAULTS.classes;
    const added = refill(state, pack, nowIso(), { perDay: settings.perDay, classes });
    const learning = Object.entries(state.words).filter(([, w]) => w.status === 'learning' || w.status === 'shaky').map(([k]) => k);
    const sentencesText = msg.sentences.map((s) => msg.text.slice(s.start, s.end));
    const candidates = (msg.candidates || []).map((c) => ({ ...c, rel: c.start - msg.sentences[c.sentence].start }));
    const result = await chain.verify({ pack, sentences: sentencesText, candidates, learning, tiers });
    const used = tiers.find((t) => t.name === result.tier);
    if (used?.kind === 'cloud') {
      quota = quotaRecord(quota, 'cloud', nowIso());
      await store.set({ quota });
    }
    scheduleCacheSave();
    const pageKey = `${sender?.tab?.id ?? 'x'}:${msg.pageKey || msg.url || ''}`;
    const { budget, carry } = budgetFor(Number(msg.words) || 0, settings.ratio, carries.get(pageKey) || 0);
    carries.set(pageKey, carry);
    if (carries.size > 500) carries.delete(carries.keys().next().value);
    const chosen = select(state, pack, result.accepted, { ratio: settings.ratio, perSentence: settings.perSentence }, budget, nowIso());
    if (added.length) await saveState(lang);
    const swaps = chosen.map((c) => {
      const e = pack.entries[c.key] || {};
      const w = state.words[c.key];
      return { start: c.start, end: c.end, form: c.form, key: c.key, english: c.english || msg.text.slice(c.start, c.end), sense: e.sense || '', hint: e.hint || '', status: w?.status || 'queue', first: !w || !w.encounters };
    });
    return { generation, tier: result.tier, swaps };
  }

  async function event(msg, sender) {
    if (!sender?.tab || !EVENTS.has(msg.event) || typeof msg.key !== 'string') return { ok: false };
    const lang = settings.lang;
    const state = await stateFor(lang);
    const changed = record(state, msg.key, msg.event, nowIso());
    if (changed) await saveState(lang);
    return { ok: changed };
  }

  async function stateReply() {
    const lang = settings.lang;
    const pack = await packFor(lang).catch(() => null);
    const state = await stateFor(lang);
    const { name: tier } = await resolveTiers(lang);
    return {
      settings: { ...settings },
      hasKey: Boolean(cloudKey),
      summary: pack ? summary(state, pack, nowIso()) : null,
      tier,
      providers: { nano: availability.nano || 'unavailable', translator: availability.translator || 'unavailable', cloud: Boolean(cloudProvider()) },
      quota: { cloud: { used: quotaCount(quota, 'cloud', nowIso()), limit: settings.cloudLimit } },
      generation,
    };
  }

  async function handle(msg, sender) {
    switch (msg?.type) {
      case 'config': return config(msg.url || sender?.url);
      case 'verify': return verify(msg, sender);
      case 'event': return event(msg, sender);
      case 'state': return stateReply();
      case 'toggle': {
        settings = mergeSettings(settings, { enabled: typeof msg.enabled === 'boolean' ? msg.enabled : !settings.enabled });
        await store.set({ settings });
        await bump();
        return { ok: true, enabled: settings.enabled };
      }
      case 'site': {
        settings = mergeSettings(settings, { sites: setSite(settings.sites, msg.url, Boolean(msg.enabled)) });
        await store.set({ settings });
        await bump();
        return { ok: true };
      }
      case 'settings': {
        settings = mergeSettings(settings, msg.patch || {});
        await store.set({ settings });
        await bump();
        return { ok: true, settings };
      }
      case 'setKey': {
        cloudKey = String(msg.key || '');
        if (cloudKey) await store.set({ cloudKey });
        else await store.remove('cloudKey');
        await bump();
        return { ok: true, hasKey: Boolean(cloudKey) };
      }
      case 'seed': {
        const pack = await packFor(settings.lang);
        const state = await stateFor(settings.lang);
        const n = seedKnown(state, pack, Number(msg.n) || 0, nowIso());
        await saveState(settings.lang);
        return { ok: true, changed: n };
      }
      case 'reset': {
        const lang = msg.lang || settings.lang;
        states.set(lang, newState());
        await store.remove(`state:${lang}`);
        await bump();
        return { ok: true };
      }
      case 'export': {
        const all = await store.get(null);
        const statesOut = Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith('state:')));
        return { settings: { ...settings }, states: statesOut, exportedAt: nowIso() };
      }
      case 'import': {
        const data = msg.data || {};
        if (data.settings) settings = mergeSettings(DEFAULT_SETTINGS, data.settings);
        for (const [k, v] of Object.entries(data.states || {})) {
          if (k.startsWith('state:') && v && typeof v === 'object') {
            states.set(k.slice(6), v);
            await store.set({ [k]: v });
          }
        }
        await store.set({ settings });
        await bump();
        return { ok: true };
      }
      default:
        return { ok: false, error: 'unknown message' };
    }
  }

  async function onAlarm(name) {
    if (name !== 'daily') return;
    const all = await store.get(null);
    for (const k of Object.keys(all)) {
      if (!k.startsWith('state:')) continue;
      const lang = k.slice(6);
      const state = await stateFor(lang);
      if (promote(state, nowIso()).length) await saveState(lang);
    }
    availability = { at: 0, tiers: null, name: 'none' };
  }

  async function onCommand(name) {
    if (name === 'toggle') await handle({ type: 'toggle' }, {});
  }

  // Drops in-memory state so the next read comes from storage (tests, import).
  function invalidate() {
    states.clear();
    availability = { at: 0, tiers: null, name: 'none' };
  }

  return { init, handle, onAlarm, onCommand, invalidate, get generation() { return generation; } };
}
