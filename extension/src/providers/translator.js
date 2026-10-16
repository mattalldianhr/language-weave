// Chrome Translator API as a verifier: translate the sentence and accept a candidate only when a
// pack form of every swapped word appears in the translation (the experiment's F3 check).
// Never adds extras. Throws on API failure so the chain falls through.
import { formsOf } from '../shared/pack.js';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const isWord = (ch) => /[\p{L}\p{N}]/u.test(ch || '');

// Whole-phrase presence with word boundaries; for German a single-word form may also end a longer
// token (compound nouns such as Kaffeebohnen ~ Bohnen).
function present(translation, form, lang) {
  const hay = norm(translation);
  const needle = norm(form);
  if (!needle) return false;
  let from = 0;
  for (;;) {
    const i = hay.indexOf(needle, from);
    if (i < 0) return false;
    const j = i + needle.length;
    const endOk = !isWord(hay[j]);
    const startOk = !isWord(hay[i - 1]) || (lang === 'de' && !needle.includes(' '));
    if (startOk && endOk) return true;
    from = i + 1;
  }
}

export function createTranslatorProvider({ Translator = globalThis.Translator } = {}) {
  const translators = new Map(); // lang -> promise of translator

  async function availability(lang) {
    if (!Translator || typeof Translator.availability !== 'function') return 'unavailable';
    try {
      const a = await Translator.availability({ sourceLanguage: 'en', targetLanguage: lang });
      if (a === 'available') return 'available';
      if (a === 'downloadable' || a === 'downloading') return 'downloadable';
      return 'unavailable';
    } catch {
      return 'unavailable';
    }
  }

  function translatorFor(lang) {
    if (!translators.has(lang)) {
      const p = Translator.create({ sourceLanguage: 'en', targetLanguage: lang }).catch((e) => {
        translators.delete(lang);
        throw e;
      });
      translators.set(lang, p);
    }
    return translators.get(lang);
  }

  async function verify({ pack, sentences, candidates }) {
    const t = await translatorFor(pack.lang);
    const translated = new Map();
    for (const c of candidates) {
      if (translated.has(c.sentence)) continue;
      translated.set(c.sentence, await t.translate(sentences[c.sentence]));
    }
    const verdicts = candidates.map((c) => {
      const out = translated.get(c.sentence) || '';
      if (c.alternatives?.length) {
        const form = c.alternatives.find((alt) => present(out, alt, pack.lang));
        return form ? { id: c.id, ok: true, form } : { id: c.id, ok: false };
      }
      const keys = c.keys || [c.key];
      const ok = keys.every((k) => {
        const e = pack.entries[k];
        return e && formsOf(pack, e).some((f) => present(out, f, pack.lang));
      });
      return { id: c.id, ok };
    });
    return { ok: true, verdicts, extras: [] };
  }

  return { name: 'translator', availability, verify };
}
