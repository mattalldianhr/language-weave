"""Task 4: top-300 per language with share, cumulative coverage, grammar flag.

Usage:
  python3 -I top300.py --freq-dir <dir> --out-dir research/data

Primary list = wordfreq top_n_list(lang, 300). Columns:
  rank, word, share (% of tokens, wordfreq), cumulative (%),
  kind (grammar|content|number, HEURISTIC hand list), opensubs_rank
  (rank of the same string in OpenSubtitles 2018, blank if absent).
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import LANGS, OPENSUBS_FILE, load_opensubs  # noqa: E402
from grammar_lists import classify  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--freq-dir", required=True, type=Path)
    ap.add_argument("--out-dir", required=True, type=Path)
    args = ap.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    import wordfreq as wf

    print("| lang | grammar | content | number | grammar share of top-300 tokens (%) | content share (%) |")
    print("|---|---:|---:|---:|---:|---:|")
    for lang in LANGS:
        rows, _, _ = load_opensubs(args.freq_dir / OPENSUBS_FILE[lang])
        os_rank = {w: i for i, (w, _) in enumerate(rows, start=1)}
        top = wf.top_n_list(lang, 300)
        out = args.out_dir / f"top300-{lang}.csv"
        cum = 0.0
        counts = {"grammar": 0, "content": 0, "number": 0}
        mass = {"grammar": 0.0, "content": 0.0, "number": 0.0}
        with out.open("w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh)
            w.writerow(["rank", "word", "share_pct", "cumulative_pct", "kind", "opensubs_rank"])
            for i, word in enumerate(top, start=1):
                f = wf.word_frequency(word, lang)
                cum += f
                kind = classify(lang, word)
                counts[kind] += 1
                mass[kind] += f
                w.writerow([i, word, f"{100 * f:.3f}", f"{100 * cum:.2f}", kind, os_rank.get(word, "")])
        tot = sum(mass.values())
        print(
            f"| {lang} | {counts['grammar']} | {counts['content']} | {counts['number']} | "
            f"{100 * mass['grammar'] / tot:.1f} | {100 * mass['content'] / tot:.1f} |"
        )


if __name__ == "__main__":
    main()
