"""Precision report for tools/eval samples judged with research/experiment/judge.py.

Usage:
  python3 -I tools/eval/report.py --judged <dir> --lang es [--gate-none 0.90] [--gate-llm 0.95]

Reads <dir>/<lang>-<tier>.judged.jsonl for each tier present and <dir>/<lang>-density.json.
Prints precision per tier and rule with 95% Wilson intervals, the painted density, and the spec's
gates (docs/superpowers/specs/2026-10-16-extension-design.md §9) as PASS or FAIL.
"""
from __future__ import annotations

import argparse
import json
import math
from collections import defaultdict
from pathlib import Path


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (c - h, c + h)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--judged", required=True, type=Path)
    ap.add_argument("--lang", required=True)
    ap.add_argument("--gate-none", type=float, default=0.90)
    ap.add_argument("--gate-llm", type=float, default=0.95)
    a = ap.parse_args()
    density = json.loads((a.judged / f"{a.lang}-density.json").read_text(encoding="utf-8"))
    ok_all = True
    for tier in ("none", "translator", "llm"):
        path = a.judged / f"{a.lang}-{tier}.judged.jsonl"
        if not path.exists():
            continue
        rows = [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]
        if not rows:
            print(f"\n{a.lang} tier={tier}: no judged items (judging failed or has not run)")
            ok_all = False
            continue
        by_rule: dict[str, list[int]] = defaultdict(lambda: [0, 0])
        errors: dict[str, int] = defaultdict(int)
        for r in rows:
            s = by_rule[r["rule"]]
            s[0] += 1
            s[1] += r["label"] == "correct"
            if r["label"] != "correct":
                errors[r["label"]] += 1
        n = sum(v[0] for v in by_rule.values())
        k = sum(v[1] for v in by_rule.values())
        lo, hi = wilson(k, n)
        d = density.get(tier, {})
        # The sample is stratified by rule (equal counts), so the pooled figure that matters is the
        # per-rule precision weighted by each rule's share of the candidate population.
        pop = d.get("byRule") or {}
        total_pop = sum(pop.values())
        weighted = None
        if total_pop and all(r in pop for r in by_rule):
            weighted = sum((rk / rn) * (pop[r] / total_pop) for r, (rn, rk) in by_rule.items())
            w_n = n  # effective sample size for the interval, conservative
            w_lo, w_hi = wilson(round(weighted * w_n), w_n)
        print(f"\n{a.lang} tier={tier}: {k}/{n} correct in the stratified sample = {100*k/n:.1f}% [{100*lo:.0f}-{100*hi:.0f}]  "
              f"candidates {d.get('candidatesPer100')}/100 words, painted {d.get('per100')}/100 at 1 in {d.get('ratio')}")
        if weighted is not None:
            print(f"  weighted by rule share of candidates: {100*weighted:.1f}% [{100*w_lo:.0f}-{100*w_hi:.0f}]")
        for rule, (rn, rk) in sorted(by_rule.items()):
            rlo, rhi = wilson(rk, rn)
            share = f" share {100*pop[rule]/total_pop:4.1f}%" if total_pop and rule in pop else ""
            print(f"  {rule:9s} {rk:4d}/{rn:<4d} {100*rk/rn:5.1f}% [{100*rlo:.0f}-{100*rhi:.0f}]{share}")
        if errors:
            print("  errors: " + ", ".join(f"{lab} {cnt}" for lab, cnt in sorted(errors.items(), key=lambda x: -x[1])))
        gate = a.gate_none if tier == "none" else a.gate_llm if tier == "llm" else None
        if gate is not None:
            rate = weighted if weighted is not None else k / n
            passed = rate >= gate
            ok_all &= passed
            print(f"  gate {gate:.0%} on the weighted rate: {'PASS' if passed else 'FAIL'}")
    print("\nOVERALL:", "PASS" if ok_all else "FAIL")


if __name__ == "__main__":
    main()
