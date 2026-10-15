"""Step 1: candidate English lexicon (~500 lemmas) from wordfreq top-1500.

Usage:
  python3 -I build_lexicon.py --wiki-dir D --pages-dir D --nltk-data D --out lexicon.json
       [--top 1500] [--target 500] [--model en_core_web_md]

Method:
  * wordfreq.top_n_list("en", top) gives surface forms. Each is mapped to a lemma
    with spaCy's corpus-observed surface->lemma majority (so "said" -> "say",
    "years" -> "year"); words absent from the corpus use WordNet morphy.
  * Grammar words (grammar_lists.classify == "grammar") are dropped unless they are
    in the connector whitelist. Modals/auxiliaries, interjections, month/day names,
    nationality adjectives, numerals and single letters are dropped.
  * Allowed POS per lemma: content POS (NOUN/VERB/ADJ/ADV) observed in the corpus
    with >= 10% share and >= 3 occurrences; lemmas with < 3 corpus occurrences fall
    back to WordNet POS whose synset count is >= 50% of the lemma's max.
  * Lemmas are ranked by their best wordfreq rank; the first `target` content
    lemmas are kept, plus the connector list and the fixed-phrase list.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exp_common import (AUX_LIKE, CONNECTORS, INTERJ_MISC, PHRASES, load_corpus)  # noqa: E402
from grammar_lists import classify  # noqa: E402  (research/grammar_lists.py)

CONTENT_POS = ("NOUN", "VERB", "ADJ", "ADV")
WN_POS = {"NOUN": "n", "VERB": "v", "ADJ": "a", "ADV": "r"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wiki-dir", required=True, type=Path)
    ap.add_argument("--pages-dir", required=True, type=Path)
    ap.add_argument("--nltk-data", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--top", type=int, default=1500)
    ap.add_argument("--target", type=int, default=500)
    ap.add_argument("--model", default="en_core_web_md")
    args = ap.parse_args()

    import nltk
    nltk.data.path.insert(0, str(args.nltk_data))
    from nltk.corpus import wordnet as wn
    import spacy
    from wordfreq import top_n_list, tokenize, zipf_frequency

    nlp = spacy.load(args.model, disable=["ner"])
    docs = load_corpus(args.wiki_dir, args.pages_dir, lambda t: tokenize(t, "en"))

    surf2lemma: dict[str, Counter] = defaultdict(Counter)
    lemma_pos: dict[str, Counter] = defaultdict(Counter)
    n_tokens = 0
    for d in docs:
        for para in d["text"].split("\n"):
            doc = nlp(para)
            for t in doc:
                if not t.is_alpha:
                    continue
                n_tokens += 1
                lw = t.text.lower()
                lem = t.lemma_.lower()
                if t.pos_ in CONTENT_POS:
                    surf2lemma[lw][lem] += 1
                    lemma_pos[lem][t.pos_] += 1
    print(f"corpus alpha tokens: {n_tokens}", file=sys.stderr)

    top = top_n_list("en", args.top)
    rows: dict[str, dict] = {}
    dropped = Counter()
    for rank, w in enumerate(top, start=1):
        if not w.isalpha() or len(w) < 2:
            dropped["non_alpha_or_short"] += 1
            continue
        if w in CONNECTORS:
            continue  # added separately
        if classify("en", w) == "grammar":
            dropped["grammar"] += 1
            continue
        if w in AUX_LIKE or w in INTERJ_MISC:
            dropped["aux_or_misc"] += 1
            continue
        # lemma
        if surf2lemma.get(w):
            lem = surf2lemma[w].most_common(1)[0][0]
        else:
            lem = wn.morphy(w) or w
        if lem in AUX_LIKE or lem in INTERJ_MISC or classify("en", lem) == "grammar":
            dropped["aux_or_misc_lemma"] += 1
            continue
        # POS
        cp = lemma_pos.get(lem, Counter())
        total = sum(cp.values())
        pos_set: list[str] = []
        if total >= 3:
            pos_set = [p for p in CONTENT_POS if cp[p] >= 3 and cp[p] / total >= 0.10]
        if not pos_set:
            syn = {p: len(wn.synsets(lem, WN_POS[p])) for p in CONTENT_POS}
            mx = max(syn.values())
            if mx == 0:
                dropped["no_wordnet"] += 1
                continue
            pos_set = [p for p in CONTENT_POS if syn[p] >= 0.5 * mx]
        if lem in rows:
            continue  # inflected variant of a lemma we already have
        rows[lem] = {
            "lemma": lem,
            "class": "content",
            "pos": pos_set,
            "wordfreq_rank": rank,
            "zipf": zipf_frequency(lem, "en"),
            "synsets": {p: len(wn.synsets(lem, WN_POS[p])) for p in pos_set},
            "corpus_pos_counts": {p: cp[p] for p in CONTENT_POS if cp[p]},
            "corpus_count": total,
        }
    content = sorted(rows.values(), key=lambda r: r["wordfreq_rank"])[: args.target]

    conn = []
    for w, allowed in CONNECTORS.items():
        conn.append({
            "lemma": w, "class": "connector", "pos": ["CONJ"], "allowed_spacy_pos": sorted(allowed),
            "wordfreq_rank": (top.index(w) + 1) if w in top else None,
            "zipf": zipf_frequency(w, "en"),
            "synsets": {"CONJ": len(wn.synsets(w, "r"))},
            "corpus_count": sum(lemma_pos.get(w, Counter()).values()),
        })
    phrases = [{"lemma": p, "class": "phrase", "pos": ["PHRASE"], "synsets": {}, "wordfreq_rank": None}
               for p in dict.fromkeys(PHRASES)]

    out = {"content": content, "connectors": conn, "phrases": phrases,
           "meta": {"top": args.top, "target": args.target, "model": args.model,
                    "dropped": dict(dropped), "n_content": len(content),
                    "n_entries": sum(len(r["pos"]) for r in content) + len(conn) + len(phrases)}}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    pc = Counter(p for r in content for p in r["pos"])
    print(f"content lemmas: {len(content)}  entries by POS: {dict(pc)}  connectors: {len(conn)}  phrases: {len(phrases)}")
    print(f"dropped: {dict(dropped)}")
    print(f"last kept wordfreq rank: {content[-1]['wordfreq_rank']}")


if __name__ == "__main__":
    main()
