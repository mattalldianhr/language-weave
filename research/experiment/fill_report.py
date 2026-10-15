"""Fill the F3-dependent placeholders of report-template.md from the judged and candidate files.

Usage:
  python3 -I fill_report.py --run-dir R --judged-dir judged --template report-template.md \
      --out ../experiment-deterministic.md [--decision decision.md]

Every number comes from judged/<lang>.jsonl (labels) joined by cid to
R/candidates-<lang>.jsonl (filter flags, NMT output) and R/nmt-meta-<lang>.json.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exp_common import LANGS, read_jsonl  # noqa: E402

RULES = ["N-bare", "N-det", "N-adj", "ADJ-pred", "ADV-tok", "CONN-tok", "V-inf", "V-pres", "PHRASE"]
ERR = ["wrong_sense", "wrong_gender", "wrong_number", "wrong_case", "wrong_conjugation", "wrong_order_or_awkward", "should_not_swap_other"]
CONS = {"CONN-tok", "ADV-tok", "N-det", "N-adj"}


def wilson(k: int, n: int) -> str:
    if n == 0:
        return ""
    z = 1.96
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return f"[{100 * (c - h):.0f}-{100 * (c + h):.0f}]"


def prec(rows) -> str:
    n = len(rows)
    if n == 0:
        return "n/a"
    k = sum(1 for r in rows if r["label"] == "correct")
    return f"{100 * k / n:.1f}% {wilson(k, n)} n={n}"


def is_cons(r: dict) -> bool:
    if r["rule"] not in CONS:
        return False
    if r["lang"] == "de" and r["rule"] in ("N-det", "N-adj") and r["meta"].get("case") not in ("NOM", "ACC"):
        return False
    return True


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-dir", required=True, type=Path)
    ap.add_argument("--judged-dir", required=True, type=Path)
    ap.add_argument("--template", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--decision", type=Path)
    args = ap.parse_args()

    stats = json.loads((args.run_dir / "stats.json").read_text(encoding="utf-8"))
    W = stats["total_words"]
    cands = {l: read_jsonl(args.run_dir / f"candidates-{l}.jsonl") for l in LANGS}
    bycid = {l: {c["cid"]: c for c in cands[l]} for l in LANGS}
    meta = {}
    for l in LANGS:
        p = args.run_dir / f"nmt-meta-{l}.json"
        meta[l] = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}

    def refresh(rows, l):
        for r in rows:
            c = bycid[l].get(r["cid"])
            if c:
                for k in ("f2", "f3", "f1_nmt", "nmt_pass", "mt", "in_subset"):
                    if k in c:
                        r[k] = c[k]
        return rows

    judged = {l: refresh(read_jsonl(args.judged_dir / f"{l}.jsonl"), l) for l in LANGS}
    opus_cons = {}
    for l in LANGS:
        p = args.judged_dir / f"cons-opus-{l}.jsonl"
        if p.exists():
            opus_cons[l] = refresh(read_jsonl(p), l)
    es_opus = refresh(read_jsonl(args.judged_dir / "es-opus.jsonl"), "es") if (args.judged_dir / "es-opus.jsonl").exists() else []

    allj = [r for l in LANGS for r in judged[l] if r["rule"] != "F0-lemma"]
    V: dict[str, str] = {}

    # precision at F3 pooled by rule, ALL, per language
    for rule in RULES:
        V[f"F3_P_{rule}"] = prec([r for r in allj if r["rule"] == rule and r.get("f3")])
    V["F3_P_ALL"] = prec([r for r in allj if r.get("f3")])
    V["F3_ALL"] = V["F3_P_ALL"].split(" ")[0]
    for l in LANGS:
        V[f"F3_L_{l}"] = prec([r for r in judged[l] if r["rule"] != "F0-lemma" and r.get("f3")])
    sub = [r for r in allj if r.get("f3")]
    cnt = Counter(r["label"] for r in sub)
    n = len(sub)
    V["F3_ERR"] = f"{n} | " + (" | ".join(f"{100 * cnt[k] / n:.1f}%" for k in ["correct"] + ERR) if n else " | ".join(["n/a"] * 8))

    # pack entries with >=1 F3-retained candidate
    for l in LANGS:
        V[f"F3_PACK_{l}"] = str(len({k for c in cands[l] if c.get("f3") for k in c["pack_keys"]}))

    # recall rows
    for l in LANGS:
        SW = meta[l].get("subset_words") or 0
        best = {}
        for c in cands[l]:
            if c["class"] != "NOUN" or c["f0_only"]:
                continue
            key = (c["sid"], c["end"])
            rank = {"N-adj": 3, "N-det": 2, "N-bare": 1}[c["rule"]]
            if key not in best or rank > best[key][0]:
                best[key] = (rank, c)
        non_noun = [c for c in cands[l] if c["class"] != "NOUN" and not c["f0_only"]]
        pool_all = non_noun + [c for _, c in best.values()]
        # conservative: CONN/ADV + best of N-adj/N-det, de NOM/ACC
        best_c = {}
        for c in cands[l]:
            if c["f0_only"] or not is_cons(c) or c["class"] != "NOUN":
                continue
            key = (c["sid"], c["end"])
            rank = {"N-adj": 2, "N-det": 1}[c["rule"]]
            if key not in best_c or rank > best_c[key][0]:
                best_c[key] = (rank, c)
        pool_cons = [c for c in non_noun if c["rule"] in ("CONN-tok", "ADV-tok")] + [c for _, c in best_c.values()]

        def f3rate(pool):
            if not SW:
                return "n/a"
            return f"{100 * sum(1 for c in pool if c.get('f3') and c.get('in_subset')) / SW:.2f}"

        V[f"F3_R_{l}_all"] = f3rate(pool_all)
        V[f"F3_R_{l}_cons"] = f3rate(pool_cons)
        V[f"C3_R_{l}"] = f3rate(pool_cons)
        V[f"C1_{l}"] = f"{100 * sum(1 for c in pool_cons if c.get('f1')) / W:.2f}"
        V[f"C2_{l}"] = f"{100 * sum(1 for c in pool_cons if c.get('f2')) / W:.2f}"

    # conservative precision at F3, sonnet and opus
    s_all, o_all = [], []
    for l in LANGS:
        s_rows = [r for r in judged[l] if is_cons(r) and r.get("f3")]
        o_rows = [r for r in opus_cons.get(l, []) if r.get("f3")]
        s_all += s_rows
        o_all += o_rows
        V[f"C3_S_{l}"] = prec(s_rows)
        V[f"C3_O_{l}"] = prec(o_rows)
    V["C3_S_all"] = prec(s_all)
    V["C3_O_all"] = prec(o_all)
    V["C3_SHORT"] = f"{prec(s_all).split(' ')[0]} / {prec(o_all).split(' ')[0]} {prec(o_all).split(' ')[1]}"
    V["C3_RULES"] = "; ".join(
        f"{rule} {prec([r for r in s_all if r['rule'] == rule]).split(' n=')[0]} / {prec([r for r in o_all if r['rule'] == rule]).split(' n=')[0]} "
        f"(n={sum(1 for r in s_all if r['rule'] == rule)})" for rule in ("CONN-tok", "ADV-tok", "N-det", "N-adj"))

    # reliability at F3 on the 100 es items
    so = {r["cid"]: r for r in judged["es"]}
    ids = [r["cid"] for r in es_opus if r["cid"] in so and so[r["cid"]].get("f3")]
    if ids:
        sc = sum(1 for c in ids if so[c]["label"] == "correct")
        oc = sum(1 for r in es_opus if r["cid"] in ids and r["label"] == "correct")
        V["RELIAB_F3"] = f"(n={len(ids)}) Sonnet {100 * sc / len(ids):.0f}% / Opus {100 * oc / len(ids):.0f}%"
    else:
        V["RELIAB_F3"] = "n/a"

    # NMT availability line appended to the F3 precision table note
    avail = "; ".join(f"{l} {sum(1 for r in judged[l] if r['rule'] != 'F0-lemma' and r.get('mt'))}/{sum(1 for r in judged[l] if r['rule'] != 'F0-lemma')}" for l in LANGS)
    V["NMT_AVAIL"] = avail

    # failure examples: 15, prefer F3 then F2, spread over languages and labels
    import re as _re
    contra = _re.compile(r"accept as correct|is acceptable|swap itself is acceptable|actually .*correct|is correct\b|is fine\b", _re.I)
    wrong_f3 = [r for r in allj if r["label"] != "correct" and r.get("f3")]
    noisy = [r for r in wrong_f3 if contra.search(r["reason"])]
    V["JUDGE_NOISE"] = (f"Of the {len(wrong_f3)} F3 items Sonnet labelled not-correct, {len(noisy)} carry a reason that itself "
                        f"calls the swap acceptable (self-contradicting labels); counting them as correct would move pooled F3 from "
                        f"{100 * (len(sub) - len(wrong_f3)) / len(sub):.1f}% to {100 * (len(sub) - len(wrong_f3) + len(noisy)) / len(sub):.1f}%.")
    ex = [r for r in allj if r["label"] != "correct" and not contra.search(r["reason"])]
    ex.sort(key=lambda r: (not r.get("f3"), not r.get("f2"), r["lang"], r["rule"]))
    seen = Counter()
    lines = []
    for r in ex:
        key = (r["lang"], r["label"])
        if seen[key] >= 2:
            continue
        seen[key] += 1
        lines.append(f"{len(lines) + 1}. [{r['lang']} {r['rule']} F2={'y' if r.get('f2') else 'n'} F3={'y' if r.get('f3') else 'n'}] "
                     f"\"{r['swapped'][:220]}\" — swap: {r['english']} -> {r['target']} — **{r['label']}**: {r['reason']}")
        if len(lines) >= 15:
            break
    V["FAILURES"] = "\n".join(lines)
    V["DECISION"] = args.decision.read_text(encoding="utf-8").strip() if args.decision and args.decision.exists() else "@@DECISION@@"

    text = args.template.read_text(encoding="utf-8")
    text = text.replace("@@DECISION@@", V.pop("DECISION"))  # inject first so its own markers get filled
    for k, v in V.items():
        text = text.replace(f"@@{k}@@", v)
    text = text.replace("(POS mismatch); F0-only items were", f"(POS mismatch); judged items with NMT output available: {avail}. F0-only items were")
    args.out.write_text(text, encoding="utf-8")
    left = [w for w in text.split() if "@@" in w]
    print(f"wrote {args.out}; unfilled: {left}")
    print(json.dumps({k: V[k] for k in ("F3_P_ALL", "C3_S_all", "C3_O_all", "F3_R_es_all", "C3_R_es", "RELIAB_F3")}, indent=0))


if __name__ == "__main__":
    main()
