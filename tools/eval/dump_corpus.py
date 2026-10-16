"""Dump the research corpus (20 Wikipedia extracts + 7 saved pages) as JSONL for tools/eval/run.mjs.

Usage:
  python3 -I tools/eval/dump_corpus.py --experiment research/experiment \
      --wiki-dir <downloads>/web/wiki --pages-dir <downloads>/web/pages --out <scratch>/corpus.jsonl

Reuses research/experiment/exp_common.load_corpus so the documents are exactly the experiment's.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--experiment", required=True, type=Path)
    ap.add_argument("--wiki-dir", required=True, type=Path)
    ap.add_argument("--pages-dir", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    a = ap.parse_args()
    sys.path.insert(0, str(a.experiment.resolve()))
    import exp_common  # noqa: E402

    import re

    docs = exp_common.load_corpus(a.wiki_dir, a.pages_dir, tokenize=lambda s: re.findall(r"\w+", s))
    a.out.parent.mkdir(parents=True, exist_ok=True)
    with a.out.open("w", encoding="utf-8") as f:
        for d in docs:
            f.write(json.dumps(d, ensure_ascii=False) + "\n")
    print(f"{len(docs)} documents -> {a.out}")


if __name__ == "__main__":
    main()
