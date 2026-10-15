"""Step 5a: stratified judging sample per language from the F1 candidate set (+ an F0-only slice).

Usage:
  python3 -I sample.py --run-dir R --lang es --out samples/es.jsonl [--seed 7]
      [--nouns 120] [--adjs 60] [--advs 100] [--verbs 100] [--phrases 20] [--f0 40]

Nouns: half N-bare, half N-det, plus every N-adj (capped at 20). Adverbs/connectors
are drawn 50/50 where possible. Verbs are split evenly between V-inf and V-pres.
F0-only items (spaCy POS != pack POS) are judged separately so F0 precision can be
computed as a weighted mix of the F1 set and the F0-only set.
Sampling is random with a fixed seed; at most 3 items per lemma per rule to spread
the sample over the pack.
"""

from __future__ import annotations

import argparse
import random
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exp_common import read_jsonl, write_jsonl  # noqa: E402


def draw(pool: list[dict], n: int, rng: random.Random, per_lemma: int = 3) -> list[dict]:
    rng.shuffle(pool)
    seen: dict[str, int] = defaultdict(int)
    out = []
    for c in pool:
        if seen[c["lemma"]] >= per_lemma:
            continue
        seen[c["lemma"]] += 1
        out.append(c)
        if len(out) >= n:
            break
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-dir", required=True, type=Path)
    ap.add_argument("--lang", required=True)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--nouns", type=int, default=120)
    ap.add_argument("--adjs", type=int, default=60)
    ap.add_argument("--advs", type=int, default=100)
    ap.add_argument("--verbs", type=int, default=100)
    ap.add_argument("--phrases", type=int, default=20)
    ap.add_argument("--f0", type=int, default=40)
    args = ap.parse_args()
    rng = random.Random(args.seed)
    cands = read_jsonl(args.run_dir / f"candidates-{args.lang}.jsonl")
    by_rule: dict[str, list[dict]] = defaultdict(list)
    for c in cands:
        by_rule[c["rule"]].append(c)
    sample: list[dict] = []
    nadj = draw(list(by_rule["N-adj"]), 20, rng)
    half = (args.nouns - len(nadj)) // 2
    sample += nadj
    sample += draw(list(by_rule["N-det"]), half, rng)
    sample += draw(list(by_rule["N-bare"]), args.nouns - len(sample), rng)
    sample += draw(list(by_rule["ADJ-pred"]), args.adjs, rng)
    advs = draw(list(by_rule["ADV-tok"]), args.advs // 2, rng)
    conns = draw(list(by_rule["CONN-tok"]), args.advs - len(advs), rng)
    if len(conns) < args.advs - len(advs):
        advs = draw(list(by_rule["ADV-tok"]), args.advs - len(conns), rng)
    sample += advs + conns
    vinf = draw(list(by_rule["V-inf"]), args.verbs // 2, rng)
    vpres = draw(list(by_rule["V-pres"]), args.verbs - len(vinf), rng)
    if len(vpres) < args.verbs - len(vinf):
        vinf = draw(list(by_rule["V-inf"]), args.verbs - len(vpres), rng)
    sample += vinf + vpres
    sample += draw(list(by_rule["PHRASE"]), args.phrases, rng)
    sample += draw(list(by_rule["F0-lemma"]), args.f0, rng, per_lemma=2)
    # de-duplicate by cid, keep order
    seen = set()
    out = []
    for c in sample:
        if c["cid"] in seen:
            continue
        seen.add(c["cid"])
        out.append(c)
    write_jsonl(args.out, out)
    from collections import Counter
    print(f"{args.lang}: {len(out)} items: {dict(Counter(c['rule'] for c in out))}")


if __name__ == "__main__":
    main()
