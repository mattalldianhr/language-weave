"""Tasks 2 and 3: Ferriss list coverage, union, and overlap with modern top-100.

Usage:
  python3 -I ferriss_lists.py --freq-dir <dir> --out-dir research/data

Multi-word Ferriss entries are expanded: "a/an" -> a, an; "either/or" ->
either, or; "there is" -> there, is; "thank you" -> thank, you. Everything
is lowercased ("I" -> "i").

Coverage on OpenSubtitles = sum(count[w]) / total word tokens.
Coverage on wordfreq = sum(word_frequency(w, "en")).
Tokenization caveat: OpenSubtitles splits clitics ("it's" -> "it" + "'s"),
so "it", "i", "do" etc. absorb their contracted uses. wordfreq keeps
contractions whole ("it's", "don't"), so those tokens are NOT counted
toward "it"/"do" on wordfreq.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import (  # noqa: E402
    OPENSUBS_FILE,
    dedupe,
    ferriss_entries,
    ferriss_spoken,
    ferriss_written,
    FERRISS_SPOKEN_RAW,
    FERRISS_WRITTEN_RAW,
    load_opensubs,
    pct,
)


def jaccard(a: set[str], b: set[str]) -> float:
    return len(a & b) / len(a | b) if (a | b) else 0.0


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--freq-dir", required=True, type=Path)
    ap.add_argument("--out-dir", required=True, type=Path)
    args = ap.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    import wordfreq as wf

    rows, total, _ = load_opensubs(args.freq_dir / OPENSUBS_FILE["en"])
    os_count = {w: c for w, c in rows}
    os_rank = {w: i for i, (w, _) in enumerate(rows, start=1)}
    os_top100 = [w for w, _ in rows[:100]]
    os_top300 = [w for w, _ in rows[:300]]

    wf_top100 = wf.top_n_list("en", 100)
    wf_top300 = wf.top_n_list("en", 300)
    wf_rank = {w: i for i, w in enumerate(wf.top_n_list("en", 50000), start=1)}

    written_entries = ferriss_entries(FERRISS_WRITTEN_RAW)
    spoken_entries = ferriss_entries(FERRISS_SPOKEN_RAW)
    written = dedupe(ferriss_written())
    spoken = dedupe(ferriss_spoken())
    union = dedupe(written + spoken)
    only_written = [w for w in written if w not in set(spoken)]
    only_spoken = [w for w in spoken if w not in set(written)]

    def os_cov(words):
        return sum(os_count.get(w, 0) for w in words) / total

    def wf_cov(words):
        return sum(wf.word_frequency(w, "en") for w in words)

    def missing_os(words):
        return [w for w in words if w not in os_count]

    result = {
        "written_entries": len(written_entries),
        "spoken_entries": len(spoken_entries),
        "written_words": len(written),
        "spoken_words": len(spoken),
        "union_words": len(union),
        "only_written": only_written,
        "only_spoken": only_spoken,
        "coverage": {
            "opensubs": {
                "written": os_cov(written),
                "spoken": os_cov(spoken),
                "union": os_cov(union),
                "modern_top100": os_cov(os_top100),
                "modern_top25": os_cov(os_top100[:25]),
                "modern_top300": os_cov(os_top300),
            },
            "wordfreq": {
                "written": wf_cov(written),
                "spoken": wf_cov(spoken),
                "union": wf_cov(union),
                "modern_top100": wf_cov(wf_top100),
                "modern_top25": wf_cov(wf_top100[:25]),
                "modern_top300": wf_cov(wf_top300),
            },
        },
        "ferriss_first25_written": {
            "words": written[:25],
            "opensubs": os_cov(written[:25]),
            "wordfreq": wf_cov(written[:25]),
        },
        "overlap": {},
        "ranks": {},
    }

    for label, modern in (("opensubs", os_top100), ("wordfreq", wf_top100)):
        for lname, lst in (("written", written), ("spoken", spoken)):
            a, b = set(lst), set(modern)
            result["overlap"][f"{lname}_vs_{label}_top100"] = {
                "jaccard": jaccard(a, b),
                "intersection": len(a & b),
                "ferriss_not_in_modern": sorted(a - b),
                "modern_not_in_ferriss": [w for w in modern if w not in a],
            }
    # Written-100 vs modern top-300: how far down do Ferriss's words sit?
    for label, rank in (("opensubs", os_rank), ("wordfreq", wf_rank)):
        r = {w: rank.get(w) for w in union}
        result["ranks"][label] = r
        worst = sorted(((rank.get(w) or 10**9), w) for w in union)[-15:]
        result["ranks"][f"{label}_lowest_ranked_union_words"] = [
            f"{w}:{(rk if rk < 10**9 else 'absent')}" for rk, w in worst
        ]
        result["ranks"][f"{label}_union_outside_top300"] = sorted(
            w for w in union if (rank.get(w) or 10**9) > 300
        )

    (args.out_dir / "ferriss-lists.json").write_text(json.dumps(result, indent=1, ensure_ascii=False))

    # ---- print markdown
    print("## Ferriss list sizes\n")
    print(f"- written entries: {len(written_entries)} -> words: {len(written)}")
    print(f"- spoken entries: {len(spoken_entries)} -> words: {len(spoken)}")
    print(f"- union after dedupe: {len(union)}")
    print(f"- only in written ({len(only_written)}): {', '.join(only_written)}")
    print(f"- only in spoken ({len(only_spoken)}): {', '.join(only_spoken)}")
    print()
    print("## Coverage of English token stream (%)\n")
    print("| word set | OpenSubtitles | wordfreq |")
    print("|---|---:|---:|")
    c = result["coverage"]
    for k, lab in (
        ("written", "Ferriss written-100"),
        ("spoken", "Ferriss spoken-100"),
        ("union", "Ferriss union"),
        ("modern_top25", "corpus own top-25"),
        ("modern_top100", "corpus own top-100"),
        ("modern_top300", "corpus own top-300"),
    ):
        print(f"| {lab} | {pct(c['opensubs'][k])} | {pct(c['wordfreq'][k])} |")
    f25 = result["ferriss_first25_written"]
    print(f"| Ferriss written first-25 | {pct(f25['opensubs'])} | {pct(f25['wordfreq'])} |")
    print()
    print("## Overlap with modern top-100\n")
    for k, v in result["overlap"].items():
        print(f"### {k}: Jaccard {v['jaccard']:.3f}, shared {v['intersection']}")
        print(f"- Ferriss words not in modern top-100 ({len(v['ferriss_not_in_modern'])}): "
              + ", ".join(v["ferriss_not_in_modern"]))
        print(f"- modern top-100 words not in Ferriss ({len(v['modern_not_in_ferriss'])}): "
              + ", ".join(v["modern_not_in_ferriss"]))
        print()
    print("## Ferriss union words outside each corpus top-300\n")
    for label in ("opensubs", "wordfreq"):
        lst = result["ranks"][f"{label}_union_outside_top300"]
        print(f"- {label} ({len(lst)}): " + ", ".join(f"{w}({result['ranks'][label][w] or 'absent'})" for w in lst))
    miss = missing_os(union)
    print(f"\n- union words absent from OpenSubtitles vocabulary: {miss or 'none'}")


if __name__ == "__main__":
    main()
