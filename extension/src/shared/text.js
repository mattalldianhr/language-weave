// Text utilities. Pure: no DOM, no extension APIs.

const ABBREVIATIONS = new Set([
  'dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr', 'st', 'mt', 'vs', 'etc', 'inc', 'ltd', 'co', 'corp',
  'e.g', 'i.e', 'cf', 'approx', 'dept', 'est', 'fig', 'no', 'vol', 'pp', 'ca', 'jan', 'feb', 'mar',
  'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec', 'u.s', 'u.k', 'a.m', 'p.m',
]);

// Sentence spans [{start, end}] over the original string. Splits after . ! ? when followed by
// whitespace and an upper-case letter, digit, or opening quote, unless the word before the stop is
// a known abbreviation or a single initial.
export function splitSentences(text) {
  const spans = [];
  let start = 0;
  const re = /[.!?]+["'”’)\]]*(?=\s+["'“‘(\[]?[\p{Lu}\p{N}])/gu;
  let m;
  while ((m = re.exec(text))) {
    const end = m.index + m[0].length;
    const before = text.slice(start, m.index);
    const lastWord = (before.match(/[\p{L}.]+$/u) || [''])[0].toLowerCase().replace(/\.$/, '');
    const isInitial = /^\p{Lu}$/u.test(lastWord) || /^(\p{Lu}\.)*\p{Lu}$/u.test(before.match(/[\p{L}.]+$/u)?.[0] || '');
    if (m[0].startsWith('.') && (ABBREVIATIONS.has(lastWord) || isInitial)) continue;
    spans.push(trim(text, start, end));
    start = end;
  }
  if (start < text.length) spans.push(trim(text, start, text.length));
  return spans.filter((s) => s.end > s.start);
}

function trim(text, start, end) {
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  return { start, end };
}

// FNV-1a 32-bit, hex. Stable across sessions; used for cache keys, not security.
export function hashText(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const WORD = /[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu;

// Running words for the density ratio: letters and digits, apostrophes inside a word.
export function countWords(text) {
  const m = text.match(WORD);
  return m ? m.length : 0;
}

// True when [start, end) overlaps any whole-word occurrence of a listed expression.
export function overlapsBlocklist(text, start, end, blocklist) {
  if (!blocklist || !blocklist.length) return false;
  const lower = text.toLowerCase();
  for (const phrase of blocklist) {
    const p = phrase.toLowerCase();
    let from = 0;
    for (;;) {
      const i = lower.indexOf(p, from);
      if (i < 0) break;
      const j = i + p.length;
      const wholeStart = i === 0 || !/[\p{L}\p{N}]/u.test(lower[i - 1]);
      const wholeEnd = j === lower.length || !/[\p{L}\p{N}]/u.test(lower[j]);
      if (wholeStart && wholeEnd && i < end && j > start) return true;
      from = i + 1;
    }
  }
  return false;
}
