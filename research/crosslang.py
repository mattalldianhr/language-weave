"""Task 6: cross-language consistency of top-100 lists.

Usage:
  python3 -I crosslang.py --freq-dir <dir> --out-dir research/data

For each target language take wordfreq top_n_list(lang, 100). Using the
MODEL-JUDGED glosses in translations.py, count how many of those words have
a direct one-word English equivalent, and how many of those equivalents sit
in the English top-300 (wordfreq) and in the English top-300 (OpenSubtitles).
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import OPENSUBS_FILE, TARGETS, load_opensubs  # noqa: E402
from translations import TRANSLATIONS  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--freq-dir", required=True, type=Path)
    ap.add_argument("--out-dir", required=True, type=Path)
    args = ap.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    import wordfreq as wf

    en_wf300 = set(wf.top_n_list("en", 300))
    en_wf100 = set(wf.top_n_list("en", 100))
    rows, _, _ = load_opensubs(args.freq_dir / OPENSUBS_FILE["en"])
    en_os300 = {w for w, _ in rows[:300]}

    out = args.out_dir / "crosslang-top100.csv"
    fh = out.open("w", newline="", encoding="utf-8")
    w = csv.writer(fh)
    w.writerow(["lang", "rank", "word", "gloss", "in_en_wf100", "in_en_wf300", "in_en_os300"])

    print("| lang | top-100 words | numerals/proper | no 1-word gloss | has gloss | gloss in en wf top-100 | gloss in en wf top-300 | gloss in en OpenSubs top-300 |")
    print("|---|---:|---:|---:|---:|---:|---:|---:|")
    details: dict[str, dict[str, list[str]]] = {}
    for lang in TARGETS:
        top = wf.top_n_list(lang, 100)
        tr = TRANSLATIONS[lang]
        missing = [t for t in top if t not in tr]
        if missing:
            print(f"WARNING {lang}: no gloss entry for {missing}", file=sys.stderr)
        numerals = [t for t in top if t.isdigit()]
        proper = [t for t in top if tr.get(t) is None and (t in ("france", "brasil", "the", "中国", "美国", "日本"))]
        no_gloss = [t for t in top if tr.get(t) is None and t not in numerals and t not in proper]
        glossed = [(t, tr[t]) for t in top if tr.get(t)]
        in100 = [t for t, g in glossed if g in en_wf100]
        in300 = [t for t, g in glossed if g in en_wf300]
        inos = [t for t, g in glossed if g in en_os300]
        not300 = [f"{t}={g}" for t, g in glossed if g not in en_wf300]
        for i, t in enumerate(top, start=1):
            g = tr.get(t)
            w.writerow([lang, i, t, g or "", int(bool(g and g in en_wf100)), int(bool(g and g in en_wf300)), int(bool(g and g in en_os300))])
        details[lang] = {"no_gloss": no_gloss, "gloss_not_in_en300": not300, "numerals_proper": numerals + proper}
        print(
            f"| {lang} | {len(top)} | {len(numerals) + len(proper)} | {len(no_gloss)} | {len(glossed)} | "
            f"{len(in100)} | {len(in300)} | {len(inos)} |"
        )
    fh.close()
    print()
    for lang in TARGETS:
        d = details[lang]
        print(f"### {lang}")
        print(f"- numerals/proper nouns excluded: {', '.join(d['numerals_proper']) or 'none'}")
        print(f"- no one-word gloss ({len(d['no_gloss'])}): {', '.join(d['no_gloss'])}")
        print(f"- glossed but gloss outside en wordfreq top-300 ({len(d['gloss_not_in_en300'])}): {', '.join(d['gloss_not_in_en300'])}")
        print()


if __name__ == "__main__":
    main()
