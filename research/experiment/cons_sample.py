"""Build the "conservative deterministic" re-judge sample (coordinator follow-up #1).

Usage:
  python3 -I cons_sample.py --judged-dir judged --out-dir samples

Configuration: rules CONN-tok, ADV-tok, N-det, N-adj only; German N-det/N-adj restricted
to NOM and ACC; every judged item (all three languages) that passes F2. Writes
samples/cons-<lang>.jsonl for judge.py (--model opus --tag cons).
"""

from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exp_common import LANGS, read_jsonl, write_jsonl  # noqa: E402

CONS_RULES = {"CONN-tok", "ADV-tok", "N-det", "N-adj"}


def is_conservative(r: dict) -> bool:
    if r["rule"] not in CONS_RULES:
        return False
    if r["lang"] == "de" and r["rule"] in ("N-det", "N-adj") and r["meta"].get("case") not in ("NOM", "ACC"):
        return False
    return True


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--judged-dir", required=True, type=Path)
    ap.add_argument("--out-dir", required=True, type=Path)
    args = ap.parse_args()
    for lang in LANGS:
        rows = read_jsonl(args.judged_dir / f"{lang}.jsonl")
        sel = [r for r in rows if is_conservative(r) and r.get("f2")]
        write_jsonl(args.out_dir / f"cons-{lang}.jsonl", sel)
        print(f"{lang}: {len(sel)} conservative F2 items: {dict(Counter(r['rule'] for r in sel))}")


if __name__ == "__main__":
    main()
