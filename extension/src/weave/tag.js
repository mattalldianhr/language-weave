// compromise wrapper: tokens with exact offsets, a small POS set, lemmas, number, degree;
// sentence spans; noun phrases with determiner, adjectives, and head noun.
// Noun phrases are built from token runs here rather than with doc.nouns(), which is ten times
// slower than tagging itself.
import nlp from '../../vendor/compromise.mjs';

const COMPARATIVE = new Set(['better', 'worse', 'more', 'less', 'further', 'farther', 'fewer', 'elder', 'lesser']);
const SUPERLATIVE = new Set(['best', 'worst', 'most', 'least', 'furthest', 'farthest', 'fewest', 'eldest']);

function posOf(tags) {
  const has = (t) => tags.includes(t);
  if (has('ProperNoun') || has('Person') || has('Place') || has('Organization')) return 'PROPN';
  if (has('Pronoun')) return 'PRON';
  if (has('Determiner')) return 'DET';
  if (has('Conjunction')) return 'CONJ';
  if (has('Preposition')) return 'ADP';
  if (has('Modal') || has('Auxiliary') || has('Copula')) return 'AUX';
  if (has('Adverb')) return 'ADV';
  if (has('Adjective')) return 'ADJ';
  if (has('Verb')) return 'VERB';
  if (has('Value') || has('Cardinal') || has('Ordinal') || has('NumericValue')) return 'NUM';
  if (has('Noun')) return 'NOUN';
  return 'X';
}

function lemmaOf(term, pos) {
  const normal = (term.normal || term.text || '').toLowerCase();
  if (pos === 'NOUN' || pos === 'VERB') return (term.root || normal).toLowerCase();
  return normal;
}

function degreeOf(tags, normal) {
  if (tags.includes('Comparative') || COMPARATIVE.has(normal)) return 'comparative';
  if (tags.includes('Superlative') || SUPERLATIVE.has(normal)) return 'superlative';
  return null;
}

export function tagBlock(text) {
  const doc = nlp(text);
  doc.compute('root');
  const json = doc.json({ offset: true, terms: { offset: true, root: true, tags: true, implicit: true, normal: true } });
  const tokens = [];
  const sentences = [];
  for (let si = 0; si < json.length; si++) {
    const s = json[si];
    const sStart = s.offset.start;
    sentences.push({ start: sStart, end: sStart + s.offset.length });
    for (const term of s.terms) {
      if (!term.offset || term.offset.length === 0 || !term.text) continue; // implicit tokens
      const tags = term.tags || [];
      const pos = posOf(tags);
      const start = term.offset.start;
      const end = start + term.offset.length;
      const normal = (term.normal || term.text).toLowerCase();
      tokens.push({
        i: tokens.length,
        text: term.text,
        start,
        end,
        normal,
        lemma: lemmaOf(term, pos),
        pos,
        tags,
        number: pos === 'NOUN' ? (tags.includes('Plural') ? 'pl' : 'sg') : null,
        degree: degreeOf(tags, normal),
        sentence: si,
        hyphenated: tags.includes('Hyphenated') || term.text.includes('-'),
        particle: tags.includes('Particle'),
        possessive: tags.includes('Possessive'),
        phrasal: tags.includes('PhrasalVerb'),
        pre: term.pre || '',
        post: term.post || '',
      });
    }
  }
  for (const s of sentences) {
    while (s.start < s.end && /\s/.test(text[s.start])) s.start++;
    while (s.end > s.start && /\s/.test(text[s.end - 1])) s.end--;
  }

  // Noun phrases: an optional determiner, then a run of adjectives and nouns ending at the last noun.
  const phrases = [];
  const inPhrase = new Set();
  const isBody = (t) => t.pos === 'ADJ' || t.pos === 'NOUN';
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (inPhrase.has(i)) continue;
    let det = null;
    let j = i;
    if (t.pos === 'DET') {
      det = i;
      j = i + 1;
    } else if (!isBody(t)) continue;
    const body = [];
    while (j < tokens.length && isBody(tokens[j]) && tokens[j].sentence === t.sentence) {
      body.push(j);
      j++;
    }
    let last = body.length - 1;
    while (last >= 0 && tokens[body[last]].pos !== 'NOUN') last--;
    if (last < 0) continue; // no head noun
    const members = body.slice(0, last + 1);
    const noun = members[last];
    const adjs = [];
    const others = [];
    for (const m of members) {
      if (m === noun) continue;
      if (tokens[m].pos === 'ADJ' && !others.length) adjs.push(m);
      else others.push(m);
    }
    const first = det ?? members[0];
    phrases.push({ start: tokens[first].start, end: tokens[noun].end, det, adjs, noun, others, sentence: t.sentence });
    if (det != null) inPhrase.add(det);
    for (const m of members) inPhrase.add(m);
  }
  return { tokens, sentences, phrases };
}
