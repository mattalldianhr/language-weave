// Daily call counts per provider. Pure functions over a small state object.
import { today } from './schedule.js';

export function quotaState() {
  return { date: '', counts: {} };
}

function fresh(state, now) {
  const date = today(now);
  return state.date === date ? state : { date, counts: {} };
}

export function quotaCount(state, provider, now) {
  return fresh(state, now).counts[provider] || 0;
}

export function quotaAllow(state, provider, limit, now) {
  return quotaCount(state, provider, now) < limit;
}

export function quotaRecord(state, provider, now) {
  const s = fresh(state, now);
  return { date: s.date, counts: { ...s.counts, [provider]: (s.counts[provider] || 0) + 1 } };
}
