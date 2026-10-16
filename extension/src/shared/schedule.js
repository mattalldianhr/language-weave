// Progression and selection. Pure: takes `now` as an ISO string or Date, never reads the clock.
// Rules and their sources are in docs/superpowers/specs/2026-10-16-extension-design.md §6.

export const DEFAULTS = Object.freeze({
  window: 20, // learning words at once
  perDay: 3, // new words per day (reader setting, 1..maxPerDay)
  maxPerDay: 5,
  shakyBlock: 5, // no new words while this many are shaky
  showsPerDay: 3, // encounters per word per day, so encounters spread across days
  knownShare: 5, // at most one known word per this many swaps
  ratio: 33, // one swap per this many running words (reader setting, no ceiling)
  perSentence: true, // at most one swap per sentence (reader setting)
  classes: ['conn', 'adv', 'noun', 'adj'], // classes that enter the learning set
  graduateEncounters: 10,
  graduateDays: 4,
  graduateSpanDays: 7,
  cleanTail: 3,
  shakyDays: 7,
  peekWindow: 7,
});

const DAY_MS = 86400000;

export function today(now) {
  const d = now instanceof Date ? now : new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayNumber(date) {
  const [y, m, d] = date.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

function daysBetween(a, b) {
  return dayNumber(b) - dayNumber(a);
}

export function newState() {
  return { words: {}, intake: { date: '', n: 0 } };
}

function word(state, key) {
  return state.words[key];
}

function ensure(state, key, now) {
  let w = state.words[key];
  if (!w) {
    w = { status: 'queue', added: today(now), days: {}, encounters: 0, lastSeen: null, lastPeek: null, lastFlip: null, changed: today(now), peekDays: [] };
    state.words[key] = w;
  }
  if (!w.days) w.days = {};
  if (!w.peekDays) w.peekDays = [];
  if (w.encounters == null) w.encounters = 0;
  return w;
}

function setStatus(w, status, now) {
  w.status = status;
  w.changed = today(now);
}

function statusOf(state, key) {
  return state.words[key]?.status || 'queue';
}

// Pack entries in introduction order: tier, then frequency rank, then key.
function ordered(pack, classes) {
  const drop = new Set((pack.drop || []).map((k) => k.toLowerCase()));
  const allowed = classes ? new Set(classes) : null;
  return Object.entries(pack.entries)
    .filter(([k, e]) => !drop.has(k.toLowerCase()) && (!allowed || allowed.has(e.class)))
    .sort(([ka, a], [kb, b]) => (a.tier || 3) - (b.tier || 3) || (a.rank || 1e9) - (b.rank || 1e9) || (ka < kb ? -1 : 1))
    .map(([k]) => k);
}

// Marks the first n pack entries known unless they already have a status. Returns the count changed.
export function seedKnown(state, pack, n, now) {
  let changed = 0;
  for (const key of ordered(pack, null).slice(0, n)) {
    if (statusOf(state, key) !== 'queue') continue;
    const w = ensure(state, key, now);
    setStatus(w, 'known', now);
    changed++;
  }
  return changed;
}

// Moves queue words into learning: up to perDay today, up to the window, unless too many are shaky.
export function refill(state, pack, now, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const date = today(now);
  if (state.intake.date !== date) state.intake = { date, n: 0 };
  const words = Object.values(state.words);
  if (words.filter((w) => w.status === 'shaky').length >= o.shakyBlock) return [];
  const learning = words.filter((w) => w.status === 'learning').length;
  const room = Math.min(o.window - learning, Math.min(o.perDay, o.maxPerDay) - state.intake.n);
  if (room <= 0) return [];
  const added = [];
  for (const key of ordered(pack, o.classes)) {
    if (added.length >= room) break;
    if (statusOf(state, key) !== 'queue') continue;
    const w = ensure(state, key, now);
    w.added = date;
    setStatus(w, 'learning', now);
    added.push(key);
  }
  state.intake.n += added.length;
  return added;
}

// seen | peek | flip. Returns false for an untracked key with a non-seen event or an unknown kind.
export function record(state, key, event, now, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const date = today(now);
  // Only tracked words (learning, shaky, known) accumulate events; queue extras stay untracked.
  if (!word(state, key)) return false;
  const w = ensure(state, key, now);
  switch (event) {
    case 'seen':
      w.days[date] = (w.days[date] || 0) + 1;
      w.encounters += 1;
      w.lastSeen = date;
      return true;
    case 'peek': {
      w.lastPeek = date;
      if (!w.peekDays.includes(date)) w.peekDays.push(date);
      w.peekDays = w.peekDays.filter((d) => daysBetween(d, date) <= o.peekWindow).slice(-10);
      if (w.status === 'known' && w.peekDays.length >= 2) setStatus(w, 'shaky', now);
      return true;
    }
    case 'flip':
      w.lastFlip = date;
      if (w.status === 'learning' || w.status === 'known') setStatus(w, 'shaky', now);
      return true;
    default:
      return false;
  }
}

function encounterDays(w) {
  return Object.keys(w.days || {}).sort();
}

function graduates(w, o) {
  const days = encounterDays(w);
  if (w.encounters < o.graduateEncounters) return false;
  if (days.length < o.graduateDays) return false;
  if (daysBetween(days[0], days[days.length - 1]) < o.graduateSpanDays) return false;
  const tail = days.slice(-o.cleanTail);
  const tailStart = tail[0];
  for (const bad of [w.lastPeek, w.lastFlip]) {
    if (bad && dayNumber(bad) >= dayNumber(tailStart)) return false;
  }
  return true;
}

// Applies promotion rules for today. Idempotent. Returns the keys whose status changed.
export function promote(state, now, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const date = today(now);
  const changed = [];
  for (const [key, w] of Object.entries(state.words)) {
    if (w.status === 'learning' && graduates(w, o)) {
      setStatus(w, 'known', now);
      changed.push(key);
    } else if (w.status === 'shaky') {
      const since = [w.lastPeek, w.lastFlip, w.changed].filter(Boolean).sort().pop();
      if (since && daysBetween(since, date) >= o.shakyDays) {
        setStatus(w, 'known', now);
        changed.push(key);
      }
    }
  }
  return changed;
}

// Spacing: 1 day after the first encounter day, 3 after the second or third, 7 up to the seventh,
// then 21 (literature item 7: 1-3 days, then about a week, then 3-4 weeks).
export function due(w, now) {
  if (!w || !w.lastSeen) return true;
  const n = encounterDays(w).length;
  const interval = n < 2 ? 1 : n < 4 ? 3 : n < 8 ? 7 : 21;
  return daysBetween(w.lastSeen, today(now)) >= interval;
}

// Swaps allowed for a block of `words` running words at one swap per `ratio` words. The fractional
// remainder carries to the next block so small paragraphs still get their share over a page.
export function budgetFor(words, ratio, carry = 0) {
  const r = Math.max(1, Number(ratio) || DEFAULTS.ratio);
  const total = words + carry;
  const budget = Math.floor(total / r);
  return { budget, carry: total - budget * r };
}

// Chooses up to `budget` candidates. Never mutates state. Result keeps document order.
export function select(state, pack, candidates, settings, budget, now) {
  const o = { ...DEFAULTS, ...settings };
  const date = today(now);
  if (budget <= 0 || !candidates.length) return [];
  const rankOf = (c) => {
    const w = state.words[c.key];
    const status = w?.status || 'queue';
    if (status === 'learning') return due(w, now) ? 0 : 1;
    if (status === 'shaky') return 1;
    if (status === 'known') return 2;
    return 3;
  };
  const entryOrder = (c) => {
    const e = pack.entries[c.key] || {};
    return ((e.tier || 3) * 1e7) + (e.rank || 1e6);
  };
  const eligible = candidates.filter((c) => (state.words[c.key]?.days?.[date] || 0) < o.showsPerDay);
  const sorted = [...eligible].sort((a, b) => rankOf(a) - rankOf(b) || entryOrder(a) - entryOrder(b) || a.start - b.start);
  const maxKnown = Math.floor(budget / o.knownShare);
  const usedKeys = new Set();
  const usedSentences = new Set();
  let known = 0;
  const chosen = [];
  for (const c of sorted) {
    if (chosen.length >= budget) break;
    if (usedKeys.has(c.key)) continue;
    if (o.perSentence && usedSentences.has(c.sentence)) continue;
    if (rankOf(c) === 2) {
      if (known >= maxKnown) continue;
      known++;
    }
    usedKeys.add(c.key);
    usedSentences.add(c.sentence);
    chosen.push(c);
  }
  return chosen.sort((a, b) => a.start - b.start);
}

// Counts by status and the words encountered today, for the popup.
export function summary(state, pack, now) {
  const date = today(now);
  const out = { learning: 0, shaky: 0, known: 0, queue: 0, today: [] };
  for (const [key, w] of Object.entries(state.words)) {
    out[w.status] = (out[w.status] || 0) + 1;
    if (w.days?.[date]) {
      const e = pack.entries[key] || {};
      out.today.push({ key, target: e.target, sense: e.sense, status: w.status, seen: w.days[date] });
    }
  }
  out.today.sort((a, b) => b.seen - a.seen || (a.key < b.key ? -1 : 1));
  return out;
}
