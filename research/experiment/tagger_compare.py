"""Step 6: compare compromise (JS) POS decisions with spaCy on the judged items.

Usage:
  python3 -I tagger_compare.py --run-dir R --judged-dir judged --compromise R/compromise.jsonl \
      --out R/tagger.json

For each judged item the compromise term covering the head token is found by
character offset, its tags are mapped to a coarse POS, and compared with (a) spaCy's
POS and (b) the pack POS the rule requires. From that:
  * POS agreement with spaCy on judged items;
  * what F1 would look like with compromise's decision: judged-correct items it would
    drop (F1 items where compromise POS != pack POS) and judged-wrong items it would
    admit (F0-only items where compromise POS == pack POS), plus a population-weighted
    precision estimate.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exp_common import LANGS, read_jsonl  # noqa: E402


def comp_pos(tags: list[str]) -> str:
    t = set(tags)
    if "ProperNoun" in t:
        return "PROPN"
    if "Pronoun" in t:
        return "PRON"
    if "Noun" in t:
        return "NOUN"
    if "Verb" in t:
        return "AUX" if ({"Auxiliary", "Modal", "Copula"} & t) else "VERB"
    if "Adjective" in t:
        return "ADJ"
    if "Adverb" in t:
        return "ADV"
    if "Conjunction" in t:
        return "CONJ"
    if "Preposition" in t:
        return "ADP"
    if "Determiner" in t:
        return "DET"
    if {"Value", "Cardinal", "Ordinal"} & t:
        return "NUM"
    return "X"


def pack_pos_of(item: dict) -> str:
    if item["rule"] == "F0-lemma":
        return item["meta"]["pack_pos"]
    return {"NOUN": "NOUN", "ADJ": "ADJ", "ADV": "ADV", "CONN": "CONJ", "VERB": "VERB"}[item["class"]]


def matches_pack(cpos: str, ppos: str) -> bool:
    if ppos == "CONJ":
        return cpos in ("CONJ", "ADV")
    return cpos == ppos


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-dir", required=True, type=Path)
    ap.add_argument("--judged-dir", required=True, type=Path)
    ap.add_argument("--compromise", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    comp = {r["sid"]: r["terms"] for r in read_jsonl(args.compromise)}
    stats = json.loads((args.run_dir / "stats.json").read_text(encoding="utf-8"))
    out = {"spacy_words_per_sec": stats.get("spacy_words_per_sec"), "langs": {}}
    pooled = Counter()
    for lang in LANGS:
        jp = args.judged_dir / f"{lang}.jsonl"
        if not jp.exists():
            continue
        judged = [r for r in read_jsonl(jp) if r["class"] != "PHRASE"]
        cands = read_jsonl(args.run_dir / f"candidates-{lang}.jsonl")
        n_f1 = sum(1 for c in cands if c["f1"])
        n_f0 = sum(1 for c in cands if c["f0_only"])
        c = Counter()
        confusion = Counter()
        for r in judged:
            terms = comp.get(r["sid"], [])
            head = r["end"] - 1
            term = next((t for t in terms if t["start"] <= head < t["end"]), None)
            if term is None:
                c["unaligned"] += 1
                continue
            cpos = comp_pos(term["tags"])
            spos = r["spacy_pos"]
            ppos = pack_pos_of(r)
            correct = r["label"] == "correct"
            agree = (cpos == spos) or (ppos == "CONJ" and cpos in ("CONJ", "ADV") and spos in ("SCONJ", "CCONJ", "ADV"))
            c["n"] += 1
            c["agree_spacy"] += agree
            confusion[f"{spos}->{cpos}"] += 1
            admit = matches_pack(cpos, ppos)
            if r["rule"] == "F0-lemma":
                c["f0_n"] += 1
                c["f0_admit"] += admit
                c["f0_admit_correct"] += admit and correct
                c["f0_admit_wrong"] += admit and not correct
                c["f0_correct"] += correct
            else:
                c["f1_n"] += 1
                c["f1_correct"] += correct
                c["f1_drop"] += not admit
                c["f1_drop_correct"] += (not admit) and correct
                c["f1_drop_wrong"] += (not admit) and not correct
        # population-weighted precision of "F1 with compromise's POS decision"
        res = dict(c)
        if c["f1_n"] and c["f0_n"]:
            p_f1_corr_admit = (c["f1_correct"] - c["f1_drop_correct"]) / c["f1_n"]
            p_f1_admit = (c["f1_n"] - c["f1_drop"]) / c["f1_n"]
            p_f0_corr_admit = c["f0_admit_correct"] / c["f0_n"]
            p_f0_admit = c["f0_admit"] / c["f0_n"]
            num = n_f1 * p_f1_corr_admit + n_f0 * p_f0_corr_admit
            den = n_f1 * p_f1_admit + n_f0 * p_f0_admit
            res["precision_spacy_f1"] = round(c["f1_correct"] / c["f1_n"], 4)
            res["precision_compromise_f1"] = round(num / den, 4) if den else None
            res["retained_share_compromise_vs_spacy"] = round(den / n_f1, 4)
        res["agreement_rate"] = round(c["agree_spacy"] / c["n"], 4) if c["n"] else None
        res["confusions_top"] = confusion.most_common(12)
        res["n_f1_candidates"] = n_f1
        res["n_f0_only_candidates"] = n_f0
        out["langs"][lang] = res
        pooled.update({k: v for k, v in c.items()})
    out["pooled"] = dict(pooled)
    if pooled["n"]:
        out["pooled"]["agreement_rate"] = round(pooled["agree_spacy"] / pooled["n"], 4)
    args.out.write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps({k: v for k, v in out["pooled"].items()}, indent=0))
    for lang, r in out["langs"].items():
        print(lang, {k: r[k] for k in ("agreement_rate", "precision_spacy_f1", "precision_compromise_f1",
                                        "retained_share_compromise_vs_spacy", "f1_drop_correct", "f1_drop_wrong",
                                        "f0_admit_correct", "f0_admit_wrong") if k in r})


if __name__ == "__main__":
    main()
