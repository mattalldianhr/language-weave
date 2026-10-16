// Verifier chain: tries each tier in order, falls through on failure, and ends at the rule-only
// floor. Verdicts are cached by pack revision, sentence text, pack key, and offset.
import { hashText } from '../shared/text.js';

const sentenceOffsets = (sentences, candidates) => {
  // Candidates carry block offsets; `rel` is the offset inside their sentence.
  return candidates.map((c) => (c.rel != null ? c.rel : c.start));
};

export function createChain({ cache }) {
  const verdictKey = (pack, sentence, c, rel) => `${pack.revision}:${hashText(sentence)}:${c.key}:${rel}`;
  const extrasKey = (pack, sentence, learning, tier) => `${pack.revision}:x:${hashText(sentence)}:${hashText([...learning].sort().join(','))}:${tier}`;

  const noneTier = (candidates) => candidates.filter((c) => c.dominant && !c.needsVerifier).map((c) => ({ ...c, verified: 'none' }));

  async function verify({ pack, sentences, candidates, learning = [], tiers = [] }) {
    const rels = sentenceOffsets(sentences, candidates);
    const accepted = [];
    const uncached = [];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const hit = cache.get(verdictKey(pack, sentences[c.sentence], c, rels[i]));
      if (hit === undefined) uncached.push(c);
      else if (hit.ok) accepted.push({ ...c, form: hit.form || c.form, verified: 'cache' });
    }
    const sentenceIdx = [...new Set(candidates.map((c) => c.sentence))];
    let usedTier = uncached.length ? null : 'cache';
    let extras = [];

    for (const { name, provider } of tiers) {
      const wantsExtras = name === 'llm' && learning.length;
      const extrasHits = wantsExtras ? sentenceIdx.map((si) => cache.get(extrasKey(pack, sentences[si], learning, name))) : [];
      const extrasCached = wantsExtras && extrasHits.every((h) => h !== undefined);
      if (!uncached.length && (!wantsExtras || extrasCached)) {
        if (wantsExtras) extras = extrasHits.flat();
        break;
      }
      let result;
      try {
        result = await provider.verify({ pack, sentences, candidates: uncached, learning: wantsExtras ? learning : [] });
      } catch {
        continue; // next tier
      }
      if (!result || !Array.isArray(result.verdicts)) continue;
      usedTier = name;
      const byId = new Map(result.verdicts.map((v) => [v.id, v]));
      for (const c of uncached) {
        const v = byId.get(c.id);
        let ok = Boolean(v?.ok);
        // An ambiguous candidate is accepted only with one of its listed forms.
        if (ok && c.alternatives?.length && !c.alternatives.includes(v.form)) ok = false;
        const form = ok ? v.form || c.form : undefined;
        cache.set(verdictKey(pack, sentences[c.sentence], c, c.rel != null ? c.rel : c.start), ok ? { ok: true, form } : { ok: false });
        if (ok) accepted.push({ ...c, form, verified: name });
      }
      if (wantsExtras) {
        const bySentence = new Map(sentenceIdx.map((si) => [si, []]));
        for (const x of result.extras || []) if (bySentence.has(x.sentence)) bySentence.get(x.sentence).push(x);
        for (const si of sentenceIdx) cache.set(extrasKey(pack, sentences[si], learning, name), bySentence.get(si));
        extras = [...bySentence.values()].flat();
      }
      break;
    }
    if (usedTier == null) {
      usedTier = 'none';
      accepted.push(...noneTier(uncached));
    }
    // Extras carry sentence offsets; lift them to block offsets using the sentence starts.
    const starts = sentenceStarts(sentences, candidates);
    for (const x of extras) {
      const base = starts.get(x.sentence) ?? 0;
      accepted.push({ ...x, start: base + x.start, end: base + x.end, rel: x.start, verified: usedTier });
    }
    accepted.sort((a, b) => a.start - b.start);
    return { tier: usedTier, accepted };
  }

  return { verify };
}

// Block offset of each sentence, recovered from candidates (block start - sentence-relative start).
function sentenceStarts(sentences, candidates) {
  const starts = new Map();
  for (const c of candidates) if (c.rel != null && !starts.has(c.sentence)) starts.set(c.sentence, c.start - c.rel);
  if (!starts.size) {
    let pos = 0;
    sentences.forEach((s, i) => { starts.set(i, pos); pos += s.length + 1; });
  }
  return starts;
}
