// Article and agreement rules per language. Pure.
// Ported from research/experiment/swapper.py (judged form accuracy ~97% on article+noun).

const VOWEL = /^[aeiouàáâäèéêëìíîïòóôöùúûüh]/i;

// French words with an aspirated h: no elision ("le hasard").
const FR_ASPIRATED_H = new Set([
  'hasard', 'haut', 'haute', 'hauts', 'hautes', 'hauteur', 'héros', 'hors', 'huit', 'handicap', 'hockey',
  'homard', 'honte', 'hache', 'haine', 'halle', 'hamburger', 'hanche', 'haricot', 'hasards', 'hérisson',
  'hibou', 'hiérarchie', 'hollande', 'hongrie', 'hurler', 'hutte',
]);

// Spanish feminine nouns that take "el"/"un" in the singular (stressed initial a).
const ES_EL_FEMININE = new Set(['agua', 'área', 'alma', 'águila', 'hambre', 'aula', 'arma', 'ala', 'ancla', 'hacha', 'asma']);

const DE_DEF = {
  nom: { m: 'der', f: 'die', n: 'das', pl: 'die' },
  acc: { m: 'den', f: 'die', n: 'das', pl: 'die' },
  dat: { m: 'dem', f: 'der', n: 'dem', pl: 'den' },
  gen: { m: 'des', f: 'der', n: 'des', pl: 'der' },
};
const DE_IND = {
  nom: { m: 'ein', f: 'eine', n: 'ein' },
  acc: { m: 'einen', f: 'eine', n: 'ein' },
  dat: { m: 'einem', f: 'einer', n: 'einem' },
  gen: { m: 'eines', f: 'einer', n: 'eines' },
};
// Adjective endings after a definite (weak) or indefinite (mixed) article.
const DE_WEAK = {
  nom: { m: 'e', f: 'e', n: 'e', pl: 'en' },
  acc: { m: 'en', f: 'e', n: 'e', pl: 'en' },
  dat: { m: 'en', f: 'en', n: 'en', pl: 'en' },
  gen: { m: 'en', f: 'en', n: 'en', pl: 'en' },
};
const DE_MIXED = {
  nom: { m: 'er', f: 'e', n: 'es' },
  acc: { m: 'en', f: 'e', n: 'es' },
  dat: { m: 'en', f: 'en', n: 'en' },
  gen: { m: 'en', f: 'en', n: 'en' },
};

const IT_LO = /^(s[bcdfghjklmnpqrstvwxyz]|z|gn|pn|ps|x|y|i[aeiou])/i;

// Returns the article word, or null when the language has none for that slot
// (e.g. indefinite plural in German or Italian). `next` is the following word, for
// languages whose article depends on it.
export function article(lang, { definite, gender, number, case: kase = 'nom', next = '' }) {
  const pl = number === 'pl';
  const g = gender === 'n' && lang !== 'de' ? 'm' : gender;
  const n = next.toLowerCase();
  switch (lang) {
    case 'es': {
      if (definite === 'def') {
        if (!pl && g === 'f' && ES_EL_FEMININE.has(n)) return 'el';
        return pl ? (g === 'f' ? 'las' : 'los') : g === 'f' ? 'la' : 'el';
      }
      if (!pl && g === 'f' && ES_EL_FEMININE.has(n)) return 'un';
      return pl ? (g === 'f' ? 'unas' : 'unos') : g === 'f' ? 'una' : 'un';
    }
    case 'fr':
      if (definite === 'def') return pl ? 'les' : g === 'f' ? 'la' : 'le';
      return pl ? 'des' : g === 'f' ? 'une' : 'un';
    case 'de': {
      const table = definite === 'def' ? DE_DEF : DE_IND;
      const row = table[kase] || table.nom;
      return (pl ? row.pl : row[g]) || null;
    }
    case 'it': {
      const vowel = VOWEL.test(n) && !/^h/i.test(n);
      if (definite === 'def') {
        if (pl) return g === 'f' ? 'le' : IT_LO.test(n) || vowel ? 'gli' : 'i';
        if (vowel) return "l'";
        return g === 'f' ? 'la' : IT_LO.test(n) ? 'lo' : 'il';
      }
      if (pl) return null;
      if (g === 'f') return vowel ? "un'" : 'una';
      return IT_LO.test(n) ? 'uno' : 'un';
    }
    case 'pt':
      if (definite === 'def') return pl ? (g === 'f' ? 'as' : 'os') : g === 'f' ? 'a' : 'o';
      return pl ? (g === 'f' ? 'umas' : 'uns') : g === 'f' ? 'uma' : 'um';
    default:
      return null;
  }
}

// Joins an article to the phrase that follows it, applying elision where the language has it.
export function joinArticle(lang, art, rest) {
  if (art == null) return null;
  const first = rest.split(/\s+/)[0].toLowerCase();
  if (lang === 'fr' && (art === 'le' || art === 'la') && VOWEL.test(first) && !FR_ASPIRATED_H.has(first)) {
    return "l'" + rest;
  }
  if (lang === 'it' && art.endsWith("'")) return art + rest;
  return art + ' ' + rest;
}

// German adjective ending after a definite or indefinite article.
export function deAdjEnding({ article: art, gender, number, case: kase = 'nom' }) {
  const pl = number === 'pl';
  if (art === 'def') return pl ? DE_WEAK[kase].pl : DE_WEAK[kase][gender];
  if (pl) return null;
  return DE_MIXED[kase][gender];
}

const ES_APOCOPE = { grande: 'gran', bueno: 'buen', malo: 'mal', primero: 'primer', tercero: 'tercer', alguno: 'algún', ninguno: 'ningún' };
const FR_VOWEL_FORMS = { beau: 'bel', nouveau: 'nouvel', vieux: 'vieil' };

// Spanish prenominal apocope: "gran pregunta", "buen hombre" (masculine only, except grande).
export function esApocope(adj, number, gender) {
  if (number === 'sg' && adj in ES_APOCOPE && (adj === 'grande' || gender === 'm')) return ES_APOCOPE[adj];
  return adj;
}

// French masculine singular adjective before a vowel: "bel homme".
export function frVowelForm(adj, gender, number, noun) {
  if (gender === 'm' && number === 'sg' && adj in FR_VOWEL_FORMS && VOWEL.test(noun) && !FR_ASPIRATED_H.has(noun.toLowerCase())) {
    return FR_VOWEL_FORMS[adj];
  }
  return adj;
}

// Copies an initial capital from the English source onto the target.
export function capLike(src, tgt) {
  if (!tgt) return tgt;
  const first = src.charAt(0);
  if (first !== first.toLowerCase() && tgt.charAt(0) === tgt.charAt(0).toLowerCase()) {
    return tgt.charAt(0).toUpperCase() + tgt.slice(1);
  }
  return tgt;
}
