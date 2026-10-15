"""Task 1: cumulative top-N token coverage per language, per source.

Usage:
  python3 -I coverage_tables.py --freq-dir <dir with *_full.txt> --out-dir research/data

OpenSubtitles coverage = (sum of counts of the top-N word tokens) /
(total word tokens in the *_full.txt file). Pure-punctuation tokens are
dropped from both sides. For zh, Latin-script tokens (English subtitle
contamination) are also dropped and the dropped mass is reported.

wordfreq coverage = sum of wordfreq.word_frequency(w, lang) over
wordfreq.top_n_list(lang, N). wordfreq frequencies are smoothed estimates
per billion words blended across several corpora; the sum over the whole
list is slightly below 1.0, so these are coverage relative to wordfreq's
own normalisation. The top-50k mass is reported as a reference.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import LANGS, N_STEPS, OPENSUBS_FILE, load_opensubs, pct  # noqa: E402

_LATIN = re.compile(r"^[A-Za-z']+$")


def opensubs_rows(freq_dir: Path, lang: str):
    rows, total, dropped_punct = load_opensubs(freq_dir / OPENSUBS_FILE[lang])
    dropped_latin = 0
    if lang in ("zh", "ja"):
        kept = []
        for w, c in rows:
            if _LATIN.match(w):
                dropped_latin += c
            else:
                kept.append((w, c))
        rows = kept
        total -= dropped_latin
    return rows, total, dropped_punct, dropped_latin


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--freq-dir", required=True, type=Path)
    ap.add_argument("--out-dir", required=True, type=Path)
    args = ap.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    import wordfreq as wf

    os_cov: dict[str, dict[int, float]] = {}
    wf_cov: dict[str, dict[int, float]] = {}
    notes: dict[str, str] = {}
    wf_mass: dict[str, float] = {}

    for lang in LANGS:
        rows, total, dp, dl = opensubs_rows(args.freq_dir, lang)
        cum = 0
        cov: dict[int, float] = {}
        for i, (_, c) in enumerate(rows, start=1):
            cum += c
            if i in N_STEPS:
                cov[i] = cum / total
            if i >= max(N_STEPS):
                break
        os_cov[lang] = cov
        notes[lang] = (
            f"tokens={total:,} types={len(rows):,} "
            f"dropped_punct={dp:,} dropped_latin={dl:,}"
        )

        top = wf.top_n_list(lang, max(N_STEPS))
        cum_f = 0.0
        covf: dict[int, float] = {}
        for i, w in enumerate(top, start=1):
            cum_f += wf.word_frequency(w, lang)
            if i in N_STEPS:
                covf[i] = cum_f
        wf_cov[lang] = covf
        wf_mass[lang] = sum(wf.word_frequency(w, lang) for w in wf.top_n_list(lang, 50000))

    for name, cov in (("opensubs", os_cov), ("wordfreq", wf_cov)):
        out = args.out_dir / f"coverage-{name}.csv"
        with out.open("w", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["top_n"] + LANGS)
            for n in N_STEPS:
                w.writerow([n] + [f"{100 * cov[l][n]:.2f}" for l in LANGS])
        print(f"\n## Cumulative token coverage (%) — {name}\n")
        print("| top-N | " + " | ".join(LANGS) + " |")
        print("|---:|" + "---:|" * len(LANGS))
        for n in N_STEPS:
            print(f"| {n} | " + " | ".join(pct(cov[l][n]) for l in LANGS) + " |")

    print("\n## OpenSubtitles corpus notes\n")
    for lang in LANGS:
        print(f"- {lang}: {notes[lang]}")
    print("\n## wordfreq top-50k mass (sum of word_frequency)\n")
    for lang in LANGS:
        print(f"- {lang}: {wf_mass[lang]:.3f}")


if __name__ == "__main__":
    main()
