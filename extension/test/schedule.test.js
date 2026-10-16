import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULTS, newState, seedKnown, refill, record, promote, due, budgetFor, select, summary, today,
} from '../src/shared/schedule.js';

// 30-entry pack: 10 connectors tier 1, 10 nouns tier 2, 10 adverbs tier 3; ranks ascending.
function makePack() {
  const entries = {};
  for (let i = 0; i < 30; i++) {
    const tier = i < 10 ? 1 : i < 20 ? 2 : 3;
    const cls = i < 10 ? 'conn' : i < 20 ? 'noun' : 'adv';
    const pos = cls === 'conn' ? 'CONJ' : cls === 'noun' ? 'NOUN' : 'ADV';
    entries[`w${i}|${pos}`] = {
      target: `t${i}`, sense: 's', dominant: true, note: '', class: cls, tier, rank: 1000 + i,
      forms: cls === 'noun' ? { gender: 'f', sg: `t${i}`, pl: `t${i}s` } : { word: `t${i}` },
    };
  }
  return { lang: 'es', name: 'Spanish', revision: 't', blocklist: [], drop: ['w5|CONJ'], entries };
}

const T = (d, h = 10) => `2026-10-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00`;

test('today formats the local calendar date', () => {
  assert.equal(today(T(16)), '2026-10-16');
});

test('seedKnown marks the top n by tier and rank, never lowering existing statuses', () => {
  const pack = makePack();
  const s = newState();
  record(s, 'w0|CONJ', 'flip', T(1)); // untouched queue word: flip does nothing
  s.words['w1|CONJ'] = { status: 'learning', added: '2026-10-01', days: {}, encounters: 0 };
  const n = seedKnown(s, pack, 3, T(1));
  assert.equal(n, 2); // w0 and w2; w1 stays learning
  assert.equal(s.words['w0|CONJ'].status, 'known');
  assert.equal(s.words['w1|CONJ'].status, 'learning');
  assert.equal(s.words['w2|CONJ'].status, 'known');
  assert.equal(seedKnown(s, pack, 3, T(2)), 0);
});

test('refill adds up to perDay today, up to the window, in tier then rank order, skipping dropped', () => {
  const pack = makePack();
  const s = newState();
  let added = refill(s, pack, T(1), { perDay: 3 });
  assert.deepEqual(added, ['w0|CONJ', 'w1|CONJ', 'w2|CONJ']);
  assert.deepEqual(refill(s, pack, T(1), { perDay: 3 }), []); // intake used up for the day
  added = refill(s, pack, T(2), { perDay: 3 });
  assert.deepEqual(added, ['w3|CONJ', 'w4|CONJ', 'w6|CONJ']); // w5 is dropped
  for (let d = 3; d <= 9; d++) refill(s, pack, T(d), { perDay: 3 });
  const learning = Object.values(s.words).filter((w) => w.status === 'learning').length;
  assert.equal(learning, DEFAULTS.window);
});

test('refill stops while five or more words are shaky', () => {
  const pack = makePack();
  const s = newState();
  for (let i = 0; i < 5; i++) s.words[`w${i + 10}|NOUN`] = { status: 'shaky', added: '2026-10-01', days: {}, encounters: 0, lastFlip: '2026-10-01' };
  assert.deepEqual(refill(s, pack, T(2), { perDay: 3 }), []);
});

test('record: seen counts per day, peek and flip move words to shaky by the rules', () => {
  const s = newState();
  s.words['w0|CONJ'] = { status: 'learning', added: '2026-10-01', days: {}, encounters: 0 };
  record(s, 'w0|CONJ', 'seen', T(2));
  record(s, 'w0|CONJ', 'seen', T(2, 12));
  assert.equal(s.words['w0|CONJ'].days['2026-10-02'], 2);
  assert.equal(s.words['w0|CONJ'].encounters, 2);
  record(s, 'w0|CONJ', 'flip', T(2));
  assert.equal(s.words['w0|CONJ'].status, 'shaky');
  // a known word peeked on two days within seven becomes shaky; one day does not
  s.words['w1|CONJ'] = { status: 'known', added: '2026-09-01', days: {}, encounters: 20 };
  record(s, 'w1|CONJ', 'peek', T(3));
  assert.equal(s.words['w1|CONJ'].status, 'known');
  record(s, 'w1|CONJ', 'peek', T(3, 15));
  assert.equal(s.words['w1|CONJ'].status, 'known');
  record(s, 'w1|CONJ', 'peek', T(8));
  assert.equal(s.words['w1|CONJ'].status, 'shaky');
  // events on an unknown key are ignored
  assert.equal(record(s, 'nope|X', 'seen', T(3)), false);
});

test('promote: learning to known needs 10 encounters, 4 days, a week of span, and a clean tail', () => {
  const s = newState();
  s.words['w0|CONJ'] = { status: 'learning', added: '2026-10-01', days: {}, encounters: 0 };
  const seenOn = (d, n = 1) => { for (let i = 0; i < n; i++) record(s, 'w0|CONJ', 'seen', T(d)); };
  seenOn(1, 3); seenOn(2, 3); seenOn(3, 4); // 10 encounters, 3 days, span 2
  promote(s, T(3));
  assert.equal(s.words['w0|CONJ'].status, 'learning');
  seenOn(8, 1); // 4 days, span 7
  promote(s, T(8));
  assert.equal(s.words['w0|CONJ'].status, 'known');
});

test('promote: a peek on the last three encounter days blocks graduation', () => {
  const s = newState();
  s.words['w0|CONJ'] = { status: 'learning', added: '2026-10-01', days: {}, encounters: 0 };
  for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) record(s, 'w0|CONJ', 'seen', T(d));
  record(s, 'w0|CONJ', 'peek', T(9));
  promote(s, T(10));
  assert.equal(s.words['w0|CONJ'].status, 'learning');
  for (const d of [11, 12, 13]) record(s, 'w0|CONJ', 'seen', T(d));
  promote(s, T(13));
  assert.equal(s.words['w0|CONJ'].status, 'known');
});

test('promote: shaky to known after seven clean days', () => {
  const s = newState();
  s.words['w0|CONJ'] = { status: 'shaky', added: '2026-10-01', days: {}, encounters: 12, lastFlip: '2026-10-02' };
  promote(s, T(8));
  assert.equal(s.words['w0|CONJ'].status, 'shaky');
  promote(s, T(9));
  assert.equal(s.words['w0|CONJ'].status, 'known');
});

test('due follows 1-3 days, then a week, then three weeks', () => {
  const w = { status: 'learning', days: {}, encounters: 0, lastSeen: null };
  assert.equal(due(w, T(10)), true);
  w.lastSeen = '2026-10-10'; w.days = { '2026-10-10': 1 };
  assert.equal(due(w, T(10)), false);
  assert.equal(due(w, T(11)), true);
  w.days = { '2026-10-01': 1, '2026-10-03': 1, '2026-10-06': 1, '2026-10-10': 1 }; w.lastSeen = '2026-10-10';
  assert.equal(due(w, T(12)), false);
  assert.equal(due(w, T(17)), true);
  w.days = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 10].map((d) => [`2026-10-${String(d).padStart(2, '0')}`, 1]));
  assert.equal(due(w, T(20)), false);
  assert.equal(due(w, T(31)), true);
});

test('budgetFor honours the ratio exactly and carries the remainder across blocks', () => {
  let b = budgetFor(200, 33, 0);
  assert.equal(b.budget, 6);
  b = budgetFor(10, 33, b.carry); // 10 + 2 carried = 12, still under 33
  assert.equal(b.budget, 0);
  b = budgetFor(25, 33, b.carry); // 12 + 25 = 37
  assert.equal(b.budget, 1);
  assert.equal(budgetFor(200, 1, 0).budget, 200);
  assert.equal(budgetFor(50, 100, 0).budget, 0);
  assert.equal(budgetFor(50, 100, 50).budget, 1);
});

function cands(keys, sentenceOf = (i) => i) {
  return keys.map((key, i) => ({ key, start: i * 10, end: i * 10 + 5, sentence: sentenceOf(i), form: 'x' }));
}

test('select ranks due learning, then learning, then known at most one in five, then queue extras', () => {
  const pack = makePack();
  const s = newState();
  s.words['w0|CONJ'] = { status: 'learning', added: '2026-10-01', days: { '2026-10-15': 1 }, encounters: 1, lastSeen: '2026-10-15' }; // not due on the 15th
  s.words['w1|CONJ'] = { status: 'learning', added: '2026-10-01', days: { '2026-10-10': 1 }, encounters: 1, lastSeen: '2026-10-10' }; // due
  s.words['w2|CONJ'] = { status: 'known', added: '2026-09-01', days: {}, encounters: 20 };
  s.words['w3|CONJ'] = { status: 'known', added: '2026-09-01', days: {}, encounters: 20 };
  const c = cands(['w3|CONJ', 'w2|CONJ', 'w0|CONJ', 'w1|CONJ', 'w10|NOUN', 'w11|NOUN']);
  const chosen = select(s, pack, c, { ...DEFAULTS, perSentence: false }, 3, T(15));
  assert.deepEqual(chosen.map((x) => x.key), ['w0|CONJ', 'w1|CONJ', 'w10|NOUN']);
  // budget 5 allows one known word
  const five = select(s, pack, c, { ...DEFAULTS, perSentence: false }, 5, T(15));
  assert.deepEqual(five.map((x) => x.key).sort(), ['w0|CONJ', 'w1|CONJ', 'w10|NOUN', 'w11|NOUN', 'w2|CONJ'].sort());
  // document order is preserved in the result
  assert.deepEqual(five.map((x) => x.start), [...five.map((x) => x.start)].sort((a, b) => a - b));
});

test('select applies the per-sentence cap only when the setting is on, and one swap per word per block', () => {
  const pack = makePack();
  const s = newState();
  const c = cands(['w0|CONJ', 'w1|CONJ', 'w0|CONJ', 'w2|CONJ'], (i) => (i < 3 ? 0 : 1));
  const capped = select(s, pack, c, { ...DEFAULTS, perSentence: true }, 10, T(15));
  assert.deepEqual(capped.map((x) => x.key), ['w0|CONJ', 'w2|CONJ']);
  const open = select(s, pack, c, { ...DEFAULTS, perSentence: false }, 10, T(15));
  assert.deepEqual(open.map((x) => x.key), ['w0|CONJ', 'w1|CONJ', 'w2|CONJ']);
});

test('select skips a word already shown three times today', () => {
  const pack = makePack();
  const s = newState();
  s.words['w0|CONJ'] = { status: 'learning', added: '2026-10-01', days: { '2026-10-15': 3 }, encounters: 3, lastSeen: '2026-10-15' };
  const chosen = select(s, pack, cands(['w0|CONJ', 'w1|CONJ']), DEFAULTS, 2, T(15));
  assert.deepEqual(chosen.map((x) => x.key), ['w1|CONJ']);
});

test('select never changes state and returns at most the budget', () => {
  const pack = makePack();
  const s = newState();
  const before = JSON.stringify(s);
  const chosen = select(s, pack, cands(['w0|CONJ', 'w1|CONJ', 'w2|CONJ']), { ...DEFAULTS, perSentence: false }, 2, T(15));
  assert.equal(chosen.length, 2);
  assert.equal(JSON.stringify(s), before);
});

test('summary counts statuses and lists today’s words', () => {
  const pack = makePack();
  const s = newState();
  refill(s, pack, T(15), { perDay: 2 });
  record(s, 'w0|CONJ', 'seen', T(15));
  const sum = summary(s, pack, T(15));
  assert.equal(sum.learning, 2);
  assert.equal(sum.known, 0);
  assert.equal(sum.today[0].key, 'w0|CONJ');
  assert.equal(sum.today[0].target, 't0');
});
