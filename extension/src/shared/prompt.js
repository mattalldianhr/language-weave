// Verifier prompt contract and fail-closed output parsing. Pure.
// The model answers yes or no per candidate and may add swaps for learning words, but every
// added form must already exist in the pack, so nothing is invented.
import { formsOf } from './pack.js';

const INSTRUCTIONS = `You are checking word swaps for a "diglot weave" reading tool. It replaces ONE English word or short span inside an otherwise English sentence with its {LANG} equivalent, so a learner meets the {LANG} word in context. Everything around the span stays English on purpose.

For each candidate, decide whether the replacement is what a competent {LANG} teacher would accept as the right word in the right form for that slot: imagine the whole sentence translated into {LANG}; would the replacement appear there as the rendering of the English span, in this sense and this form (gender, number, article, case, conjugation, agreement)? Reject idioms and fixed expressions whose {LANG} equivalent is not this word, other senses of the lemma, phrasal verbs, names, titles, quotations, and technical uses. Do not penalise the English words around the span.

You may also add swaps from "extras_allowed": words the learner is studying that were not proposed. Add one only when the English word appears in the sentence in exactly that sense, and choose the form from the listed "forms" that fits the slot (for a verb, the form matching the subject and tense; for a noun, include the article if the English has one). Never add a word whose form is not listed.

Answer with JSON only, no prose, no code fences:
{"verdicts":[{"id":"c1","ok":true},{"id":"c2","ok":false,"why":"short reason"}],
 "extras":[{"sentence":0,"english":"think","key":"think|VERB","form":"pensamos"}]}

Input (JSON):
`;

export function buildVerifyPrompt({ pack, sentences, candidates, learning = [] }) {
  const proposed = new Set(candidates.map((c) => c.key));
  const extrasAllowed = learning
    .filter((key) => !proposed.has(key) && pack.entries[key])
    .map((key) => {
      const e = pack.entries[key];
      return { key, english: key.split('|')[0], sense: e.sense, forms: formsOf(pack, e) };
    });
  const input = {
    language: pack.name,
    sentences,
    candidates: candidates.map((c) => {
      const e = pack.entries[c.key] || {};
      return { id: c.id, sentence: c.sentence, english: c.english, replacement: c.form, sense: e.sense || '', note: e.note || '' };
    }),
    extras_allowed: extrasAllowed,
  };
  return INSTRUCTIONS.replaceAll('{LANG}', pack.name) + JSON.stringify(input);
}

function extractJson(text) {
  if (typeof text !== 'string') return null;
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try {
    return JSON.parse(text.slice(a, b + 1));
  } catch {
    return null;
  }
}

const isWordChar = (ch) => /[\p{L}\p{N}]/u.test(ch || '');

// First whole-word occurrence of `needle` in `text` that does not overlap any span in `taken`.
function findWord(text, needle, taken) {
  const lower = text.toLowerCase();
  const n = needle.toLowerCase();
  if (!n) return null;
  let from = 0;
  for (;;) {
    const i = lower.indexOf(n, from);
    if (i < 0) return null;
    const j = i + n.length;
    const whole = !isWordChar(lower[i - 1]) && !isWordChar(lower[j]);
    const free = !taken.some(([s, e]) => i < e && j > s);
    if (whole && free) return [i, j];
    from = i + 1;
  }
}

// {ok, verdicts: [{id, ok}], extras: [{sentence, start, end, english, key, form, extra: true}]}.
// Any failure to parse rejects every candidate and yields no extras.
export function parseVerdicts(text, { pack, sentences, candidates, learning = [] }) {
  const rejectAll = () => ({ ok: false, verdicts: candidates.map((c) => ({ id: c.id, ok: false })), extras: [] });
  const data = extractJson(text);
  if (!data || !Array.isArray(data.verdicts)) return rejectAll();
  const byId = new Map();
  for (const v of data.verdicts) if (v && typeof v.id === 'string') byId.set(v.id, v.ok === true);
  const verdicts = candidates.map((c) => ({ id: c.id, ok: byId.get(c.id) === true }));

  const taken = new Map(); // sentence index -> [[start, end]]
  for (const c of candidates) {
    if (!byId.get(c.id)) continue;
    if (!taken.has(c.sentence)) taken.set(c.sentence, []);
    taken.get(c.sentence).push([c.start, c.end]);
  }
  const allowed = new Set(learning);
  const extras = [];
  for (const x of Array.isArray(data.extras) ? data.extras : []) {
    if (!x || typeof x !== 'object') continue;
    const { sentence, english, key, form } = x;
    if (!Number.isInteger(sentence) || sentence < 0 || sentence >= sentences.length) continue;
    if (typeof key !== 'string' || !allowed.has(key)) continue;
    const e = pack.entries[key];
    if (!e || (pack.drop || []).includes(key)) continue;
    if (typeof form !== 'string' || !formsOf(pack, e).includes(form)) continue;
    if (typeof english !== 'string') continue;
    const spans = taken.get(sentence) || [];
    const hit = findWord(sentences[sentence], english, spans);
    if (!hit) continue;
    spans.push(hit);
    taken.set(sentence, spans);
    extras.push({ sentence, start: hit[0], end: hit[1], english: sentences[sentence].slice(hit[0], hit[1]), key, form, extra: true });
  }
  return { ok: true, verdicts, extras };
}
