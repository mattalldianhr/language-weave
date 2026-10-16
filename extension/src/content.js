// Content pipeline: scan -> tag -> candidates -> background verify + select -> paint -> events.
// Every async reply belongs to one config generation; stale replies are dropped.
import { collectBlocks, flatten, segmentFor } from './weave/scan.js';
import { tagBlock } from './weave/tag.js';
import { findCandidates } from './weave/candidates.js';
import { paintAll, unpaintAll, SWAP_CLASS } from './weave/paint.js';
import { createInteraction } from './weave/interact.js';
import { countWords, hashText } from './shared/text.js';

const api = globalThis.chrome || globalThis.browser;
const send = (msg) => api.runtime.sendMessage(msg).catch(() => null);

let config = null;
let pack = null;
let generation = 0;
const pageKey = hashText(location.href + '|' + Date.now());
const done = new WeakMap(); // block -> `${generation}:${hash}` already processed
const inflight = new Set();
const interaction = createInteraction({ doc: document, send });
let blockId = 0;

const near = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    near.unobserve(en.target);
    consider(en.target);
  }
}, { rootMargin: '600px 0px' });

async function loadPack(lang) {
  const res = await fetch(api.runtime.getURL(`packs/${lang}.json`));
  return res.json();
}

async function refresh() {
  const c = await send({ type: 'config', url: location.href });
  if (!c) return;
  const changed = !config || c.generation !== config.generation || c.lang !== config.lang || c.enabled !== config.enabled;
  config = c;
  if (!changed) return;
  generation = c.generation;
  if (!c.enabled) {
    unpaintAll(document);
    interaction.detach();
    near.disconnect();
    return;
  }
  if (!pack || pack.lang !== c.lang) pack = await loadPack(c.lang);
  unpaintAll(document);
  interaction.attach();
  track(document.body);
}

function track(root) {
  for (const el of collectBlocks(root)) near.observe(el);
}

function consider(el) {
  if (!config?.enabled || !pack || !el.isConnected) return;
  const { text, segments } = flatten(el);
  if (countWords(text) < 4) return;
  const key = `${generation}:${hashText(text)}`;
  if (done.get(el) === key || inflight.has(el)) return;
  inflight.add(el);
  process(el, text, segments, key).catch(() => {}).finally(() => inflight.delete(el));
}

async function process(el, text, segments, key) {
  const gen = generation;
  const tagged = tagBlock(text);
  const candidates = findCandidates(pack, tagged, text, { tier: config.tier })
    // only spans that sit inside one text node can be painted
    .filter((c) => segmentFor(segments, c.start, c.end));
  if (!candidates.length) { done.set(el, key); return; }
  const reply = await send({
    type: 'verify',
    url: location.href,
    pageKey,
    blockId: `b${++blockId}`,
    text,
    sentences: tagged.sentences,
    words: countWords(text),
    candidates: candidates.map(({ id, sentence, start, end, english, key: k, keys, form, dominant, needsVerifier, alternatives, rule }) => ({ id, sentence, start, end, english, key: k, keys, form, dominant, needsVerifier, alternatives, rule })),
  });
  if (!reply || reply.generation !== gen || gen !== generation || !el.isConnected) return;
  done.set(el, key);
  if (!reply.swaps?.length) return;
  // Re-flatten: the block may have changed while we waited.
  const fresh = flatten(el);
  if (fresh.text !== text) { done.delete(el); near.observe(el); return; }
  const spans = paintAll(document, fresh.segments, reply.swaps.map((s) => ({ ...s, gloss: glossOf(s) })));
  for (const span of spans) interaction.watch(span);
}

function glossOf(s) {
  return s.sense && s.sense.toLowerCase() !== s.english.toLowerCase() ? `${s.english} · ${s.sense}` : s.english;
}

const observer = new MutationObserver((records) => {
  if (!config?.enabled) return;
  const changed = new Set();
  for (const r of records) {
    for (const n of r.addedNodes || []) if (n.nodeType === 1 && !n.closest?.(`.${SWAP_CLASS}`)) track(n);
    const base = r.target.nodeType === 1 ? r.target : r.target.parentElement;
    const block = base?.closest?.('p, li, blockquote, h1, h2, h3, h4, dd, dt, figcaption, td, th');
    if (block && !block.querySelector(`.${SWAP_CLASS}`) && !inflight.has(block)) changed.add(block);
  }
  for (const el of changed) { done.delete(el); near.observe(el); }
});

api.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'config-changed') refresh();
});

refresh().then(() => {
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
});
