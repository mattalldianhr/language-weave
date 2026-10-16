// Language pack schema, validation, lookup, and form construction. Pure.
import { article, joinArticle, deAdjEnding, esApocope, frVowelForm } from './articles.js';

export const CLASSES = new Set(['conn', 'adv', 'noun', 'adj', 'verb', 'phrase']);
const POS_OF_CLASS = { conn: 'CONJ', adv: 'ADV', noun: 'NOUN', adj: 'ADJ', verb: 'VERB', phrase: 'PHRASE' };
const CLASS_OF_POS = Object.fromEntries(Object.entries(POS_OF_CLASS).map(([c, p]) => [p, c]));

export function entryKey(lemma, pos) {
  return `${lemma.toLowerCase()}|${pos.toUpperCase()}`;
}

export function classOfPos(pos) {
  return CLASS_OF_POS[pos.toUpperCase()] || null;
}

// {ok, errors}. Errors are strings naming the entry and field.
export function validatePack(pack) {
  const errors = [];
  if (!pack || typeof pack !== 'object') return { ok: false, errors: ['pack is not an object'] };
  for (const f of ['lang', 'name', 'revision']) if (typeof pack[f] !== 'string' || !pack[f]) errors.push(`missing ${f}`);
  if (!Array.isArray(pack.blocklist)) errors.push('missing blocklist');
  if (!Array.isArray(pack.drop)) errors.push('missing drop');
  if (!pack.entries || typeof pack.entries !== 'object') {
    errors.push('missing entries');
    return { ok: false, errors };
  }
  for (const [key, e] of Object.entries(pack.entries)) {
    const where = `entries[${key}]`;
    if (!/^[^|]+\|[A-Z]+$/.test(key)) errors.push(`${where}: bad key`);
    for (const f of ['target', 'sense']) if (typeof e[f] !== 'string' || !e[f]) errors.push(`${where}: missing ${f}`);
    if (!CLASSES.has(e.class)) errors.push(`${where}: bad class`);
    if (typeof e.dominant !== 'boolean') errors.push(`${where}: missing dominant`);
    if (!e.forms || typeof e.forms !== 'object') errors.push(`${where}: missing forms`);
    else if (e.class === 'noun' && (!e.forms.sg || !e.forms.pl || !e.forms.gender)) errors.push(`${where}: noun forms need gender, sg, pl`);
    else if (e.class === 'adj' && pack.lang !== 'de' && !e.forms.m_sg) errors.push(`${where}: adjective forms need m_sg`);
    else if (e.class === 'adj' && pack.lang === 'de' && !e.forms.base) errors.push(`${where}: German adjective forms need base`);
    else if (e.class === 'verb' && !e.forms.inf) errors.push(`${where}: verb forms need inf`);
    else if ((e.class === 'conn' || e.class === 'adv' || e.class === 'phrase') && !e.forms.word) errors.push(`${where}: forms need word`);
    if (e.tier != null && !(e.tier >= 1 && e.tier <= 3)) errors.push(`${where}: tier out of range`);
  }
  return { ok: errors.length === 0, errors };
}

const dropped = new WeakMap();
function dropSet(pack) {
  let s = dropped.get(pack);
  if (!s) {
    s = new Set((pack.drop || []).map((k) => k.toLowerCase()));
    dropped.set(pack, s);
  }
  return s;
}

export function lookup(pack, lemma, pos) {
  const key = entryKey(lemma, pos);
  if (dropSet(pack).has(key.toLowerCase())) return null;
  const e = pack.entries[key];
  if (!e) return null;
  if (!e.key) Object.defineProperty(e, 'key', { value: key, enumerable: false });
  return e;
}

export function keyOf(entry) {
  return entry.key;
}

// German weak masculine nouns (n-declension: Name, Mensch, Junge, Student) take -(e)n in every
// singular case but the nominative. Recognised from the genitive: "Namens", "Menschen" rather
// than a strong "-(e)s" genitive like "Hundes".
function deWeakMasculine(f) {
  if (f.gender !== 'm' || !f.gen_sg) return null;
  const g = f.gen_sg;
  if (/(en|ens)$/.test(g) && !/[^e]s$/.test(g.replace(/ens$/, 'x')) && g !== f.sg + 's' && g !== f.sg + 'es') {
    return g.replace(/s$/, '');
  }
  return null;
}

function nounForm(lang, e, number, kase) {
  const f = e.forms;
  if (lang === 'de') {
    if (number === 'sg' && kase === 'gen') return f.gen_sg || f.sg;
    if (number === 'pl' && kase === 'dat') return f.dat_pl || f.pl;
    if (number === 'sg' && (kase === 'acc' || kase === 'dat')) {
      const weak = deWeakMasculine(f);
      if (weak) return weak;
    }
  }
  return number === 'pl' ? f.pl : f.sg;
}

const CASES = ['nom', 'acc', 'dat', 'gen'];

// Article plus noun, optionally with an attributive adjective. Null when the language has no
// article for the slot or a needed form is missing.
export function nounPhrase(pack, e, { number = 'sg', definite = 'def', case: kase = 'nom', adjective = null }) {
  const lang = pack.lang;
  const g = e.forms.gender;
  const noun = nounForm(lang, e, number, kase);
  if (!noun) return null;
  if (!adjective) {
    const art = article(lang, { definite, gender: g, number, case: kase, next: noun });
    return art == null ? null : joinArticle(lang, art, noun);
  }
  const adj = adjectiveForm(pack, adjective, { gender: g, number, case: kase, article: definite, noun });
  if (adj == null) return null;
  if (lang === 'de') {
    const art = article(lang, { definite, gender: g, number, case: kase });
    return art == null ? null : `${art} ${adj} ${noun}`;
  }
  const pre = Boolean(adjective.forms.prenominal);
  const rest = pre ? `${adj} ${noun}` : noun;
  const art = article(lang, { definite, gender: g, number, next: rest.split(' ')[0] });
  if (art == null) return null;
  const head = joinArticle(lang, art, rest);
  return pre ? head : `${head} ${adj}`;
}

// Inflected adjective for a slot. For German, `article` ('def' | 'indef') and `case` pick the ending.
export function adjectiveForm(pack, e, { gender, number = 'sg', case: kase = 'nom', article: art = 'def', noun = '' }) {
  const lang = pack.lang;
  const f = e.forms;
  if (lang === 'de') {
    const ending = deAdjEnding({ article: art, gender, number, case: kase });
    if (ending == null) return null;
    return (f.stem || f.base) + ending;
  }
  const gg = gender === 'n' ? 'm' : gender;
  let form = f[`${gg}_${number}`];
  if (!form) return null;
  if (lang === 'es' && f.prenominal) form = esApocope(form, number, gg);
  if (lang === 'fr' && f.prenominal) form = frVowelForm(form, gg, number, noun);
  return form;
}

// Every surface string the verifier may accept for this entry, including article-bearing
// noun phrases. Used for fail-closed validation of model output.
export function formsOf(pack, e) {
  const lang = pack.lang;
  const out = new Set([e.target]);
  const f = e.forms;
  switch (e.class) {
    case 'noun': {
      for (const number of ['sg', 'pl']) {
        const cases = lang === 'de' ? CASES : ['nom'];
        for (const kase of cases) {
          const noun = nounForm(lang, e, number, kase);
          out.add(noun);
          for (const definite of ['def', 'indef']) {
            const np = nounPhrase(pack, e, { number, definite, case: kase });
            if (np) out.add(np);
          }
        }
      }
      break;
    }
    case 'adj': {
      if (lang === 'de') {
        const stem = f.stem || f.base;
        out.add(f.base);
        for (const end of ['e', 'en', 'er', 'es', 'em']) out.add(stem + end);
      } else {
        for (const k of ['m_sg', 'f_sg', 'm_pl', 'f_pl']) if (f[k]) out.add(f[k]);
        if (lang === 'es') out.add(esApocope(f.m_sg, 'sg', 'm'));
        if (lang === 'fr') out.add(frVowelForm(f.m_sg, 'm', 'sg', 'a'));
      }
      break;
    }
    case 'verb': {
      out.add(f.inf);
      for (const v of Object.values(f.present || {})) out.add(v);
      break;
    }
    default:
      out.add(f.word);
  }
  return [...out].filter(Boolean);
}
