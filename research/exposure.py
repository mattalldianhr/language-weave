"""Task 5: exposure test on real English web prose.

Usage:
  python3 -I exposure.py --wiki-dir <dir of action-API JSON> --pages-dir <dir of HTML> \
      --out-dir research/data

Text extraction:
  * Wikipedia: the `extract` field of action=query&prop=extracts&explaintext.
  * HTML pages: text inside <p>, <h1>-<h4>, <blockquote>, skipping
    <script>/<style>/<noscript>. If that yields < 200 tokens (Paul Graham's
    site uses <font> + <br>), fall back to all body text.
Tokenization: wordfreq.tokenize(text, "en") (lowercases, keeps contractions
like "don't" as one token). Pure-digit tokens are dropped.

Per 100 running words we count tokens that fall in:
  (a) Ferriss union, (b) wordfreq en top-100, (c) wordfreq en top-300,
  (d) each of those minus the NARROW grammar set from the brief (articles,
      forms of be/have/do, pronouns, of/to/in/that, and their contractions),
  (e) each minus the BROAD grammar set (narrow + prepositions, conjunctions,
      not, wh-words, clitics).
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import dedupe, en_is_grammar, ferriss_spoken, ferriss_written  # noqa: E402

BLOCK_TAGS = {"p", "h1", "h2", "h3", "h4", "blockquote"}
SKIP_TAGS = {"script", "style", "noscript", "svg", "template"}


class _Extractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.block_depth = 0
        self.skip_depth = 0
        self.block_text: list[str] = []
        self.all_text: list[str] = []
        self.in_body = False

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            self.skip_depth += 1
        if tag in BLOCK_TAGS:
            self.block_depth += 1
            self.block_text.append("\n")
        if tag == "body":
            self.in_body = True
        if tag in ("br", "div", "tr"):
            self.all_text.append("\n")

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1
        if tag in BLOCK_TAGS and self.block_depth:
            self.block_depth -= 1
            self.block_text.append("\n")

    def handle_data(self, data):
        if self.skip_depth:
            return
        if self.block_depth:
            self.block_text.append(data)
        if self.in_body:
            self.all_text.append(data)


def html_to_text(html: str, tokenize) -> tuple[str, str]:
    ex = _Extractor()
    ex.feed(html)
    block = "".join(ex.block_text)
    if len(tokenize(block)) >= 200:
        return block, "blocks"
    return "".join(ex.all_text), "body"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wiki-dir", required=True, type=Path)
    ap.add_argument("--pages-dir", required=True, type=Path)
    ap.add_argument("--out-dir", required=True, type=Path)
    args = ap.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    import wordfreq as wf

    def tok(text: str) -> list[str]:
        return [t for t in wf.tokenize(text, "en") if not t.isdigit()]

    docs: list[tuple[str, str, list[str]]] = []  # (group, name, tokens)
    for p in sorted(args.wiki_dir.glob("*.json")):
        data = json.loads(p.read_text(encoding="utf-8"))
        pages = data["query"]["pages"]
        extract = pages[0]["extract"] if isinstance(pages, list) else next(iter(pages.values()))["extract"]
        docs.append(("wikipedia", p.stem, tok(extract)))
    for p in sorted(args.pages_dir.glob("*.html")):
        if p.name.endswith("_index.html"):
            continue
        text, mode = html_to_text(p.read_text(encoding="utf-8", errors="replace"), tok)
        docs.append((f"web({mode})", p.stem, tok(text)))

    ferriss_union = set(dedupe(ferriss_written() + ferriss_spoken()))
    wf100 = set(wf.top_n_list("en", 100))
    wf300 = set(wf.top_n_list("en", 300))
    sets = {"ferriss_union": ferriss_union, "wf_top100": wf100, "wf_top300": wf300}

    cols = []
    for s in sets:
        cols += [s, f"{s}_minus_narrow", f"{s}_minus_broad"]

    per_doc = []
    agg = {c: 0 for c in cols}
    agg_tokens = 0
    agg_types: dict[str, set[str]] = {c: set() for c in cols}
    group_tot: dict[str, dict[str, int]] = {}
    for group, name, toks in docs:
        n = len(toks)
        row = {"group": group, "doc": name, "tokens": n}
        g = group_tot.setdefault(group, {c: 0 for c in cols} | {"tokens": 0, "docs": 0})
        g["tokens"] += n
        g["docs"] += 1
        for sname, sset in sets.items():
            hits = [t for t in toks if t in sset]
            narrow = [t for t in hits if not en_is_grammar(t, broad=False)]
            broad = [t for t in hits if not en_is_grammar(t, broad=True)]
            for c, lst in ((sname, hits), (f"{sname}_minus_narrow", narrow), (f"{sname}_minus_broad", broad)):
                row[c] = 100.0 * len(lst) / n if n else 0.0
                row[f"{c}_types"] = len(set(lst))
                agg[c] += len(lst)
                g[c] += len(lst)
                agg_types[c].update(lst)
        agg_tokens += n
        per_doc.append(row)

    out = args.out_dir / "exposure-per-doc.csv"
    with out.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(per_doc[0].keys()))
        w.writeheader()
        for r in per_doc:
            w.writerow({k: (f"{v:.2f}" if isinstance(v, float) else v) for k, v in r.items()})

    # ---- print
    print(f"Documents: {len(docs)}; total running words (non-digit tokens): {agg_tokens:,}\n")
    print("## Tokens per 100 running words (all docs pooled)\n")
    print("| word set | all | minus narrow grammar | minus broad grammar |")
    print("|---|---:|---:|---:|")
    for s in sets:
        print(
            f"| {s} (n={len(sets[s])}) | {100 * agg[s] / agg_tokens:.1f} | "
            f"{100 * agg[s + '_minus_narrow'] / agg_tokens:.1f} | "
            f"{100 * agg[s + '_minus_broad'] / agg_tokens:.1f} |"
        )
    print("\n## By group (per 100 words)\n")
    print("| group | docs | words | " + " | ".join(cols) + " |")
    print("|---|---:|---:|" + "---:|" * len(cols))
    for grp, g in group_tot.items():
        print(
            f"| {grp} | {g['docs']} | {g['tokens']:,} | "
            + " | ".join(f"{100 * g[c] / g['tokens']:.1f}" for c in cols)
            + " |"
        )
    print("\n## Per document (per 100 words)\n")
    print("| doc | words | ferriss | ferriss-narrow | ferriss-broad | wf100 | wf100-narrow | wf100-broad | wf300 | wf300-narrow | wf300-broad |")
    print("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for r in per_doc:
        print(
            f"| {r['doc']} | {r['tokens']:,} | "
            + " | ".join(f"{r[c]:.1f}" for c in cols)
            + " |"
        )
    print("\n## Distinct words hit across the whole corpus\n")
    for c in cols:
        print(f"- {c}: {len(agg_types[c])} distinct")
    print("\n## Min / median / max per-doc for key columns\n")
    import statistics as st

    for c in ("ferriss_union", "ferriss_union_minus_broad", "wf_top300", "wf_top300_minus_broad"):
        vals = [r[c] for r in per_doc]
        print(f"- {c}: min {min(vals):.1f}, median {st.median(vals):.1f}, max {max(vals):.1f}")


if __name__ == "__main__":
    main()
