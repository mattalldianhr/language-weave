"""Step 7: aggregate every number for experiment-deterministic.md from the run artifacts.

Usage:
  python3 -I report.py --run-dir R --packs-dir packs --lexicon lexicon.json \
      --judged-dir judged --tagger R/tagger.json --out-tables tables.md [--opus judged/es-opus.jsonl]

Prints markdown tables to --out-tables; the narrative report is written by hand around them.
Every precision number comes from judged/<lang>.jsonl.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exp_common import LANGS, read_jsonl  # noqa: E402

CLASS_ROWS = [("NOUN", "N-bare"), ("NOUN", "N-det"), ("NOUN", "N-adj"), ("ADJ", "ADJ-pred"),
              ("ADV", "ADV-tok"), ("CONN", "CONN-tok"), ("VERB", "V-inf"), ("VERB", "V-pres"), ("PHRASE", "PHRASE")]
LEVELS = [("F1", "f1"), ("F2", "f2"), ("F3", "f3"), ("F1+NMT", "f1_nmt"), ("F2syn3", "f2_syn3"), ("F2syn5", "f2_syn5")]
ERR_LABELS = ["wrong_sense", "wrong_gender", "wrong_number", "wrong_case", "wrong_conjugation",
              "wrong_order_or_awkward", "should_not_swap_other"]


def pct(a: float, b: float) -> str:
    return f"{100 * a / b:.1f}%" if b else "n/a"


def wilson(k: int, n: int) -> str:
    if n == 0:
        return ""
    import math
    z = 1.96
    p = k / n
    d = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / d
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return f"[{100 * (centre - half):.0f}-{100 * (centre + half):.0f}]"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-dir", required=True, type=Path)
    ap.add_argument("--packs-dir", required=True, type=Path)
    ap.add_argument("--lexicon", required=True, type=Path)
    ap.add_argument("--judged-dir", required=True, type=Path)
    ap.add_argument("--tagger", type=Path)
    ap.add_argument("--opus", type=Path)
    ap.add_argument("--out-tables", required=True, type=Path)
    args = ap.parse_args()

    out: list[str] = []
    P = out.append
    stats = json.loads((args.run_dir / "stats.json").read_text(encoding="utf-8"))
    W = stats["total_words"]
    lexicon = json.loads(args.lexicon.read_text(encoding="utf-8"))
    P(f"Corpus: {len(stats['docs'])} docs, {W} running words, {stats['n_sentences']} sentences "
      f"(spaCy {stats['model']}, {stats['spacy_words_per_sec']} words/s).\n")

    cands = {l: read_jsonl(args.run_dir / f"candidates-{l}.jsonl") for l in LANGS}
    judged = {l: read_jsonl(args.judged_dir / f"{l}.jsonl") for l in LANGS if (args.judged_dir / f"{l}.jsonl").exists()}
    # judged rows were copied before NMT ran: refresh filter flags from the candidate files by cid
    for l in judged:
        bycid = {c["cid"]: c for c in cands[l]}
        for r in judged[l]:
            c = bycid.get(r["cid"])
            if c:
                for k in ("f2", "f2_syn3", "f2_syn5", "f3", "f1_nmt", "nmt_pass", "nmt_pass_relaxed", "mt"):
                    if k in c:
                        r[k] = c[k]
    packs = {l: json.loads((args.packs_dir / f"{l}.json").read_text(encoding="utf-8")) for l in LANGS}

    # ---- pack sizes -----------------------------------------------------
    P("## Pack sizes\n")
    P("| lang | entries | by POS | dominant (F2) | syn<=3 | syn<=5 | entries with >=1 F3-retained candidate |")
    P("|---|---|---|---|---|---|---|")
    syn = {}
    for r in lexicon["content"]:
        for p in r["pos"]:
            syn[f"{r['lemma']}|{p}"] = r["synsets"].get(p, 0)
    for l in LANGS:
        es = packs[l]["entries"]
        bypos = Counter(e["pos"] for e in es.values())
        dom = sum(1 for e in es.values() if e.get("dominant_sense_covers_90pct"))
        s3 = sum(1 for k in es if syn.get(k, 0) <= 3)
        s5 = sum(1 for k in es if syn.get(k, 0) <= 5)
        used = len({k for c in cands[l] if c.get("f3") for k in c["pack_keys"]})
        P(f"| {l} | {len(es)} | {dict(sorted(bypos.items()))} | {dom} | {s3} | {s5} | {used} |")
    P("")

    # ---- retained per 100 words -----------------------------------------
    P("## Retained candidates per 100 words (recall side)\n")
    for l in LANGS:
        P(f"### {l}\n")
        meta_p = args.run_dir / f"nmt-meta-{l}.json"
        meta = json.loads(meta_p.read_text(encoding="utf-8")) if meta_p.exists() else {}
        SW = meta.get("subset_words") or 0
        sub_ok = SW > 0 and meta.get("subset_f1_sentences_translated", 0) >= 0.95 * max(1, meta.get("subset_f1_sentences", 1))
        if SW:
            P(f"F3 and F1+NMT columns are estimated on a seeded random subset of {meta['subset_sentences']} sentences "
              f"({SW} words; {meta.get('subset_f1_sentences_translated')}/{meta.get('subset_f1_sentences')} F1 sentences translated); "
              f"the F1/F2 columns are over the whole corpus. 'subset' rows show F1/F2 on the same subset for comparison.\n")

        def rate(xs, key):
            if key in ("f3", "f1_nmt"):
                if not sub_ok:
                    return "n/a"
                n = sum(1 for c in xs if c.get(key) and c.get("in_subset"))
                return f"{100 * n / SW:.2f}"
            return f"{100 * sum(1 for c in xs if c.get(key)) / W:.2f}"

        def sub_rate(xs, key):
            n = sum(1 for c in xs if c.get(key) and c.get("in_subset"))
            return f"{100 * n / SW:.2f}" if SW else "n/a"

        P("| class / rule | F0 (naive) | F1 | F2 | F3 | F1+NMT | F2syn3 | F2syn5 | F1 subset | F2 subset |")
        P("|---|---|---|---|---|---|---|---|---|---|")
        tot = Counter()
        for cls, rule in CLASS_ROWS:
            xs = [c for c in cands[l] if c["rule"] == rule]
            f0 = len(xs) + sum(1 for c in cands[l] if c["f0_only"] and c["class"] == cls and rule in ("N-bare", "ADJ-pred", "ADV-tok", "CONN-tok", "V-inf", "PHRASE"))
            row = [f"{100 * f0 / W:.2f}"]
            for _, key in LEVELS:
                row.append(rate(xs, key))
            row += [sub_rate(xs, "f1"), sub_rate(xs, "f2")]
            P(f"| {cls} {rule} | " + " | ".join(row) + " |")
        # unique opportunities: best rule per noun token
        best = {}
        for c in cands[l]:
            if c["class"] != "NOUN" or c["f0_only"]:
                continue
            key = (c["sid"], c["end"])
            rank = {"N-adj": 3, "N-det": 2, "N-bare": 1}[c["rule"]]
            if key not in best or rank > best[key][0]:
                best[key] = (rank, c)
        best_list = [c for _, c in best.values()]
        non_noun = [c for c in cands[l] if c["class"] != "NOUN" and not c["f0_only"]]
        for name, pool in (("ALL rules, nouns counted once (best rule)", non_noun + best_list),
                           ("conservative set (no N-bare, no PHRASE)", [c for c in non_noun if c["class"] != "PHRASE"] + [c for c in best_list if c["rule"] != "N-bare"])):
            row = []
            n0 = len(pool) + (sum(1 for c in cands[l] if c["f0_only"]) if name.startswith("ALL") else 0)
            row.append(f"{100 * n0 / W:.2f}")
            for _, key in LEVELS:
                row.append(rate(pool, key))
            row += [sub_rate(pool, "f1"), sub_rate(pool, "f2")]
            P(f"| **{name}** | " + " | ".join(row) + " |")
        P("")

    # ---- precision tables ----------------------------------------------
    def prec_table(rows_j: list[dict], cands_l: list[dict] | None, title: str):
        P(f"### {title}\n")
        P("| class / rule | n judged | F0 | F1 | F2 | F3 | F1+NMT | F2syn3 | F2syn5 | n(F3) |")
        P("|---|---|---|---|---|---|---|---|---|---|")
        f0only = [r for r in rows_j if r["rule"] == "F0-lemma"]
        f0_pool_rate = (sum(1 for r in f0only if r["label"] == "correct") / len(f0only)) if f0only else None
        groups = [(f"{cls} {rule}", [r for r in rows_j if r["rule"] == rule], cls) for cls, rule in CLASS_ROWS]
        groups.append(("ALL (sample mean)", [r for r in rows_j if r["rule"] != "F0-lemma"], None))
        for name, rs, cls in groups:
            if not rs:
                continue
            cells = [str(len(rs))]
            # F0: weighted mix of F1 items and F0-only items with the same pack class
            f1_corr = sum(1 for r in rs if r["label"] == "correct")
            if cands_l is not None and cls is not None:
                n1 = sum(1 for c in cands_l if c["rule"] == rs[0]["rule"])
                n0 = sum(1 for c in cands_l if c["f0_only"] and c["class"] == cls) if rs[0]["rule"] in ("N-bare", "ADJ-pred", "ADV-tok", "CONN-tok", "V-inf", "PHRASE") else 0
                f0c = [r for r in f0only if r["class"] == cls]
                r0 = (sum(1 for r in f0c if r["label"] == "correct") / len(f0c)) if len(f0c) >= 5 else f0_pool_rate
                if n0 and r0 is not None:
                    p0 = (n1 * f1_corr / len(rs) + n0 * r0) / (n1 + n0)
                    cells.append(f"{100 * p0:.1f}%")
                else:
                    cells.append("=F1")
            elif cls is None and cands_l is not None:
                n1 = sum(1 for c in cands_l if c["f1"])
                n0 = sum(1 for c in cands_l if c["f0_only"])
                # population-weighted F1 precision over rules
                num = den = 0.0
                for c2, rule in CLASS_ROWS:
                    rr = [r for r in rs if r["rule"] == rule]
                    nn = sum(1 for c in cands_l if c["rule"] == rule)
                    if rr:
                        num += nn * sum(1 for r in rr if r["label"] == "correct") / len(rr)
                        den += nn
                p1w = num / den if den else 0
                p0 = (n1 * p1w + n0 * (f0_pool_rate or 0)) / (n1 + n0) if n0 else p1w
                cells.append(f"{100 * p0:.1f}% (F1 pop-weighted {100 * p1w:.1f}%)")
            else:
                cells.append("")
            nf3 = 0
            for _, key in LEVELS:
                sub = [r for r in rs if r.get(key)]
                k = sum(1 for r in sub if r["label"] == "correct")
                cells.append(f"{pct(k, len(sub))} {wilson(k, len(sub))} n={len(sub)}" if sub else "n/a")
                if key == "f3":
                    nf3 = len(sub)
            cells.append(str(nf3))
            P(f"| {name} | " + " | ".join(cells) + " |")
        if f0only:
            k = sum(1 for r in f0only if r["label"] == "correct")
            P(f"| F0-only items (POS mismatch, judged separately) | {len(f0only)} | {pct(k, len(f0only))} {wilson(k, len(f0only))} | | | | | | | |")
        P("")
        # error breakdown per level
        P("Error types among judged items at each level (share of judged items at that level):\n")
        P("| level | n | correct | " + " | ".join(ERR_LABELS) + " |")
        P("|---|---|---|" + "---|" * len(ERR_LABELS))
        for lname, key in LEVELS[:4]:
            sub = [r for r in rows_j if r["rule"] != "F0-lemma" and r.get(key)]
            cnt = Counter(r["label"] for r in sub)
            P(f"| {lname} | {len(sub)} | {pct(cnt['correct'], len(sub))} | " + " | ".join(pct(cnt[e], len(sub)) for e in ERR_LABELS) + " |")
        sub = [r for r in rows_j if r["rule"] == "F0-lemma"]
        if sub:
            cnt = Counter(r["label"] for r in sub)
            P(f"| F0-only | {len(sub)} | {pct(cnt['correct'], len(sub))} | " + " | ".join(pct(cnt[e], len(sub)) for e in ERR_LABELS) + " |")
        P("")

    P("## Precision (judged samples)\n")
    for l in LANGS:
        if l in judged:
            prec_table(judged[l], cands[l], f"{l} (judge: sonnet)")
    allj = [r for l in judged for r in judged[l]]
    allc = [c for l in LANGS for c in cands[l]]
    prec_table(allj, allc, "All languages pooled")

    # ---- German case exposure ------------------------------------------
    P("## German case exposure (N-det/N-adj noun candidates that reached the case step)\n")
    sk = json.loads((args.run_dir / "skips-de.json").read_text(encoding="utf-8"))
    dc = Counter()
    for d, c in sk["de_case"].items():
        dc.update(c)
    cases = ["NOM", "ACC", "DAT", "GEN", "ambiguous", "unsupported"]
    total = sum(dc[c] for c in cases)
    P("| case | n | share | judged N-det/N-adj | correct | wrong_case | wrong_gender | other wrong |")
    P("|---|---|---|---|---|---|---|---|")
    dj = [r for r in judged.get("de", []) if r["rule"] in ("N-det", "N-adj")]
    for c in cases:
        js = [r for r in dj if r["meta"].get("case") == c]
        cnt = Counter(r["label"] for r in js)
        P(f"| {c} | {dc[c]} | {pct(dc[c], total)} | {len(js)} | {pct(cnt['correct'], len(js))} | {pct(cnt['wrong_case'], len(js))} | {pct(cnt['wrong_gender'], len(js))} | {pct(len(js) - cnt['correct'] - cnt['wrong_case'] - cnt['wrong_gender'], len(js))} |")
    roles = Counter({k[5:]: v for k, v in dc.items() if k.startswith("role:")})
    P("\nRoles: " + ", ".join(f"{k}={v}" for k, v in roles.most_common()) + "\n")
    # case by preposition for DAT/ACC/GEN
    P("Judged German N-det/N-adj by assigned case and label:\n")
    for c in ["NOM", "ACC", "DAT", "GEN"]:
        js = [r for r in dj if r["meta"].get("case") == c]
        P(f"- {c}: n={len(js)}, labels={dict(Counter(r['label'] for r in js))}")
    P("")

    # ---- conjugation exposure -----------------------------------------
    P("## Verb-form exposure (pack verbs, all three languages see the same English)\n")
    vf = Counter()
    sk_es = json.loads((args.run_dir / "skips-es.json").read_text(encoding="utf-8"))
    for d, c in sk_es["verb_forms"].items():
        vf.update(c)
    tot = sum(vf.values())
    covered = {"VB_to_inf", "VB_modal"} | {k for k in vf if k.startswith("present_pron_") and k != "present_pron_far"}
    P("| form | n | share | covered by rule |")
    P("|---|---|---|---|")
    for k, v in vf.most_common():
        if k == "VB_modal_negated":
            continue
        P(f"| {k} | {v} | {pct(v, tot)} | {'V-inf' if k in ('VB_to_inf', 'VB_modal') else ('V-pres' if k in covered else '-')} |")
    cov = sum(vf[k] for k in covered)
    P(f"\nCovered by V-inf + V-pres: {cov}/{tot} = {pct(cov, tot)} of pack-verb occurrences (es pack). Modal+negation inside V-inf: {vf['VB_modal_negated']}.\n")

    # ---- adjective exposure --------------------------------------------
    P("## Adjective-agreement exposure\n")
    P("| lang | noun opportunities | with adjective | with pack adjective | N-adj candidates | ADJ predicative seen | ADJ-pred candidates | attributive ADJ not swapped |")
    P("|---|---|---|---|---|---|---|---|")
    for l in LANGS:
        skl = json.loads((args.run_dir / f"skips-{l}.json").read_text(encoding="utf-8"))
        ae = Counter()
        for d, c in skl["adj_exposure"].items():
            ae.update(c)
        nadj = sum(1 for c in cands[l] if c["rule"] == "N-adj")
        npred = sum(1 for c in cands[l] if c["rule"] == "ADJ-pred")
        P(f"| {l} | {ae['noun_opportunities']} | {ae['noun_with_adjective']} ({pct(ae['noun_with_adjective'], ae['noun_opportunities'])}) | {ae['noun_with_pack_adjective']} | {nadj} | {ae['adj_predicative']} | {npred} | {ae['adj_attributive']} |")
    P("")

    # ---- skip reasons ---------------------------------------------------
    P("## Skipped opportunities by reason (per 100 words, es pack unless German-specific)\n")
    for l in LANGS:
        skl = json.loads((args.run_dir / f"skips-{l}.json").read_text(encoding="utf-8"))
        tot = Counter()
        for d, c in skl["skips"].items():
            tot.update(c)
        P(f"- {l}: " + ", ".join(f"{k}={100 * v / W:.2f}" for k, v in tot.most_common(25)))
    P("")

    # ---- judge reliability ---------------------------------------------
    if args.opus and args.opus.exists() and "es" in judged:
        P("## Judge reliability (es, sonnet vs opus)\n")
        op = {r["cid"]: r for r in read_jsonl(args.opus)}
        so = {r["cid"]: r for r in judged["es"]}
        common = [c for c in op if c in so]
        exact = sum(1 for c in common if op[c]["label"] == so[c]["label"])
        bin_ = sum(1 for c in common if (op[c]["label"] == "correct") == (so[c]["label"] == "correct"))
        # Cohen's kappa on correct-vs-not
        n = len(common)
        a = sum(1 for c in common if so[c]["label"] == "correct")
        b = sum(1 for c in common if op[c]["label"] == "correct")
        pe = (a / n) * (b / n) + (1 - a / n) * (1 - b / n) if n else 0
        po = bin_ / n if n else 0
        kappa = (po - pe) / (1 - pe) if pe < 1 else 1
        P(f"n={n}; exact label agreement {pct(exact, n)}; correct-vs-not agreement {pct(bin_, n)}; Cohen's kappa (correct-vs-not) {kappa:.2f}; "
          f"sonnet correct {pct(a, n)}, opus correct {pct(b, n)}.\n")
        P("Correct rate on the same 100 items by filter level (sonnet / opus):\n")
        P("| level | n | sonnet correct | opus correct | both correct | either wrong |")
        P("|---|---|---|---|---|---|")
        for lname, key in LEVELS[:4]:
            ids = [c for c in common if so[c].get(key)]
            if not ids:
                P(f"| {lname} | 0 | n/a | n/a | n/a | n/a |")
                continue
            sc = sum(1 for c in ids if so[c]["label"] == "correct")
            oc = sum(1 for c in ids if op[c]["label"] == "correct")
            both = sum(1 for c in ids if so[c]["label"] == "correct" and op[c]["label"] == "correct")
            P(f"| {lname} | {len(ids)} | {pct(sc, len(ids))} | {pct(oc, len(ids))} | {pct(both, len(ids))} | {pct(len(ids) - both, len(ids))} |")
        P("")
        by_rule = Counter((so[c]["rule"], so[c]["label"] == "correct", op[c]["label"] == "correct") for c in common)
        P("Disagreement direction by rule (sonnet-wrong/opus-correct vs sonnet-correct/opus-wrong): " + "; ".join(
            f"{r} {by_rule[(r, False, True)]}/{by_rule[(r, True, False)]}" for r in sorted({k[0] for k in by_rule})) + "\n")
        dis = [(so[c]["english"], so[c]["target"], so[c]["label"], op[c]["label"], op[c]["reason"]) for c in common if so[c]["label"] != op[c]["label"]]
        P("Disagreements (english -> target: sonnet / opus, opus reason):\n")
        for e, t, s, o, r in dis[:20]:
            P(f"- {e} -> {t}: {s} / {o}; {r}")
        P("")

    # ---- tagger ---------------------------------------------------------
    if args.tagger and args.tagger.exists():
        tg = json.loads(args.tagger.read_text(encoding="utf-8"))
        P("## Tagger comparison (compromise vs spaCy on judged items)\n")
        P(f"Pooled agreement: {tg['pooled'].get('agreement_rate')} on n={tg['pooled'].get('n')}.\n")
        P("| lang | agreement | spaCy-F1 precision | compromise-F1 precision (pop-weighted) | retained vs spaCy | F1 correct dropped | F1 wrong dropped | F0-only wrong admitted | F0-only correct admitted |")
        P("|---|---|---|---|---|---|---|---|---|")
        for l, r in tg["langs"].items():
            P(f"| {l} | {r.get('agreement_rate')} | {r.get('precision_spacy_f1')} | {r.get('precision_compromise_f1')} | {r.get('retained_share_compromise_vs_spacy')} | {r.get('f1_drop_correct')}/{r.get('f1_n')} | {r.get('f1_drop_wrong')}/{r.get('f1_n')} | {r.get('f0_admit_wrong')}/{r.get('f0_n')} | {r.get('f0_admit_correct')}/{r.get('f0_n')} |")
        P("\nTop confusions (spaCy->compromise): " + "; ".join(f"{k} {v}" for l in tg["langs"] for k, v in tg["langs"][l]["confusions_top"][:6]) + "\n")

    # ---- failure examples ----------------------------------------------
    P("## Failure examples (judged not correct, from the F2 or F3 sets where possible)\n")
    ex = [r for r in allj if r["label"] != "correct" and r["rule"] != "F0-lemma"]
    ex.sort(key=lambda r: (not r.get("f3"), not r.get("f2"), r["lang"]))
    seen = Counter()
    k = 0
    for r in ex:
        key = (r["lang"], r["label"])
        if seen[key] >= 2:
            continue
        seen[key] += 1
        k += 1
        P(f"{k}. [{r['lang']} {r['rule']} F2={'y' if r.get('f2') else 'n'} F3={'y' if r.get('f3') else 'n'}] "
          f"\"{r['swapped']}\" — swap {r['english']} -> {r['target']} — **{r['label']}**: {r['reason']}")
        if k >= 20:
            break
    P("")
    # ======== coordinator follow-ups ===================================
    import csv
    import re as _re
    CONS_RULES = {"CONN-tok", "ADV-tok", "N-det", "N-adj"}

    def is_cons(r: dict) -> bool:
        if r["rule"] not in CONS_RULES:
            return False
        if r["lang"] == "de" and r["rule"] in ("N-det", "N-adj") and r["meta"].get("case") not in ("NOM", "ACC"):
            return False
        return True

    # ---- (4) NMT availability on judged items ----------------------------
    P("## F3 on judged items: NMT output availability\n")
    P("| lang | judged F1 items | with NMT output | judged F2 items | F2 with NMT output | F3 (F2 and NMT pass) |")
    P("|---|---|---|---|---|---|")
    for l in LANGS:
        js = [r for r in judged.get(l, []) if r["rule"] != "F0-lemma"]
        P(f"| {l} | {len(js)} | {sum(1 for r in js if r.get('mt'))} | {sum(1 for r in js if r.get('f2'))} | "
          f"{sum(1 for r in js if r.get('f2') and r.get('mt'))} | {sum(1 for r in js if r.get('f3'))} |")
    P("")

    # ---- (1) conservative configuration ----------------------------------
    P("## Conservative deterministic configuration (CONN, ADV, N-det, N-adj; German NOM/ACC only)\n")
    opus_cons = {}
    for l in LANGS:
        pth = args.judged_dir / f"cons-opus-{l}.jsonl"
        if pth.exists():
            rows_o = read_jsonl(pth)
            bycid = {c["cid"]: c for c in cands[l]}
            for r in rows_o:
                c = bycid.get(r["cid"])
                if c:
                    for k in ("f2", "f3", "f1_nmt", "nmt_pass", "mt"):
                        if k in c:
                            r[k] = c[k]
            opus_cons[l] = {r["cid"]: r for r in rows_o}
    P("Precision (correct rate, Wilson 95% CI). Sonnet rows use every judged conservative item at that level; "
      "Opus rows are the full re-judge of the conservative F2 items.\n")
    P("| lang | judge | F1 | F2 | F3 | F1+NMT (no F2) |")
    P("|---|---|---|---|---|---|")
    pooled_s = {"f1": [], "f2": [], "f3": [], "f1_nmt": []}
    pooled_o = {"f2": [], "f3": []}
    for l in LANGS:
        js = [r for r in judged.get(l, []) if is_cons(r)]
        cells = []
        for key in ("f1", "f2", "f3", "f1_nmt"):
            sub = [r for r in js if r.get(key)]
            pooled_s[key] += sub
            k = sum(1 for r in sub if r["label"] == "correct")
            cells.append(f"{pct(k, len(sub))} {wilson(k, len(sub))} n={len(sub)}" if sub else "n/a")
        P(f"| {l} | sonnet | " + " | ".join(cells) + " |")
        if l in opus_cons:
            oc = list(opus_cons[l].values())
            cells = ["-"]
            for key in ("f2", "f3"):
                sub = [r for r in oc if r.get(key)]
                pooled_o[key] += sub
                k = sum(1 for r in sub if r["label"] == "correct")
                cells.append(f"{pct(k, len(sub))} {wilson(k, len(sub))} n={len(sub)}" if sub else "n/a")
            cells.append("-")
            P(f"| {l} | opus | " + " | ".join(cells) + " |")
    cells = []
    for key in ("f1", "f2", "f3", "f1_nmt"):
        sub = pooled_s[key]
        k = sum(1 for r in sub if r["label"] == "correct")
        cells.append(f"{pct(k, len(sub))} {wilson(k, len(sub))} n={len(sub)}" if sub else "n/a")
    P("| **pooled** | sonnet | " + " | ".join(cells) + " |")
    if opus_cons:
        cells = ["-"]
        for key in ("f2", "f3"):
            sub = pooled_o[key]
            k = sum(1 for r in sub if r["label"] == "correct")
            cells.append(f"{pct(k, len(sub))} {wilson(k, len(sub))} n={len(sub)}" if sub else "n/a")
        cells.append("-")
        P("| **pooled** | opus | " + " | ".join(cells) + " |")
    P("")
    # per rule within the configuration, pooled, both judges
    P("| rule | sonnet F2 | opus F2 | sonnet F3 | opus F3 |")
    P("|---|---|---|---|---|")
    for rule in ("CONN-tok", "ADV-tok", "N-det", "N-adj"):
        cells = []
        for key in ("f2", "f3"):
            s_sub = [r for r in pooled_s[key] if r["rule"] == rule]
            o_sub = [r for r in pooled_o.get(key, []) if r["rule"] == rule]
            for sub in (s_sub, o_sub):
                k = sum(1 for r in sub if r["label"] == "correct")
                cells.append(f"{pct(k, len(sub))} {wilson(k, len(sub))} n={len(sub)}" if sub else "n/a")
        P(f"| {rule} | {cells[0]} | {cells[1]} | {cells[2]} | {cells[3]} |")
    P("")
    if opus_cons:
        agree = tot_n = 0
        err_o = Counter()
        for l in opus_cons:
            so = {r["cid"]: r for r in judged[l]}
            for cid, r in opus_cons[l].items():
                if cid in so:
                    tot_n += 1
                    agree += (so[cid]["label"] == "correct") == (r["label"] == "correct")
                    if r["label"] != "correct":
                        err_o[r["label"]] += 1
        P(f"Sonnet/Opus correct-vs-not agreement on the conservative F2 items: {pct(agree, tot_n)} (n={tot_n}). "
          f"Opus error types: {dict(err_o)}.\n")
    # retained per 100 words for the configuration
    P("Retained opportunities per 100 words, conservative configuration (nouns once, N-adj over N-det; "
      "F3 word-scaled on the random subset):\n")
    P("| lang | F1 | F2 | F3 | F1+NMT |")
    P("|---|---|---|---|---|")
    for l in LANGS:
        meta_p = args.run_dir / f"nmt-meta-{l}.json"
        meta = json.loads(meta_p.read_text(encoding="utf-8")) if meta_p.exists() else {}
        SW = meta.get("subset_words") or 0
        best = {}
        for c in cands[l]:
            if c["f0_only"] or not is_cons(c):
                continue
            if c["class"] == "NOUN":
                key = (c["sid"], c["end"])
                rank = {"N-adj": 2, "N-det": 1}[c["rule"]]
                if key not in best or rank > best[key][0]:
                    best[key] = (rank, c)
        pool = [c for c in cands[l] if not c["f0_only"] and c["rule"] in ("CONN-tok", "ADV-tok")] + [c for _, c in best.values()]
        cells = []
        for key in ("f1", "f2", "f3", "f1_nmt"):
            if key in ("f3", "f1_nmt"):
                n = sum(1 for c in pool if c.get(key) and c.get("in_subset"))
                cells.append(f"{100 * n / SW:.2f}" if SW else "n/a")
            else:
                cells.append(f"{100 * sum(1 for c in pool if c.get(key)) / W:.2f}")
        P(f"| {l} | " + " | ".join(cells) + " |")
    P("")

    # ---- (2) per-lemma precision ------------------------------------------
    P("## Per-lemma precision (pooled, lemmas with >= 3 judged F1 items), worst first\n")
    groups: dict[tuple, list] = defaultdict(list)
    for r in allj:
        if r["rule"] == "F0-lemma":
            continue
        groups[(r["lemma"], r["class"])].append(r)
    lemma_rows = []
    for (lem, cls), rs in groups.items():
        if len(rs) < 3:
            continue
        k = sum(1 for r in rs if r["label"] == "correct")
        errs = Counter(r["label"] for r in rs if r["label"] != "correct")
        dom = errs.most_common(1)[0][0] if errs else ""
        f2 = [r for r in rs if r.get("f2")]
        k2 = sum(1 for r in f2 if r["label"] == "correct")
        lemma_rows.append({"lemma": lem, "class": cls, "n": len(rs), "correct": k, "rate": k / len(rs),
                           "dominant_error": dom, "n_f2": len(f2), "correct_f2": k2,
                           "langs": "".join(sorted({r["lang"] for r in rs}))})
    lemma_rows.sort(key=lambda x: (x["rate"], -x["n"]))
    csv_path = args.out_tables.parent / "per-lemma.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(lemma_rows[0].keys()) if lemma_rows else ["lemma"])
        w.writeheader()
        for row in lemma_rows:
            w.writerow(row)
    P(f"{len(lemma_rows)} lemmas with >= 3 judged items; full list in `per-lemma.csv`. Worst 45:\n")
    P("| lemma | class | n | correct | rate | dominant error | F2 n/correct |")
    P("|---|---|---|---|---|---|---|")
    for row in lemma_rows[:45]:
        P(f"| {row['lemma']} | {row['class']} | {row['n']} | {row['correct']} | {100 * row['rate']:.0f}% | {row['dominant_error']} | {row['n_f2']}/{row['correct_f2']} |")
    n_bad = sum(1 for r in lemma_rows if r["rate"] < 0.5)
    P(f"\nLemmas under 50% correct: {n_bad} of {len(lemma_rows)}.\n")

    # ---- (3) MWE blocklist --------------------------------------------------
    P("## Idiom / multiword-expression exposure (MWE blocklist)\n")
    mwe_path = Path(__file__).resolve().parent / "mwe_blocklist.txt"
    mwes = [ln.strip() for ln in mwe_path.read_text(encoding="utf-8").splitlines() if ln.strip() and not ln.startswith("#")]
    mwe_re = _re.compile(r"\b(" + "|".join(_re.escape(m) for m in sorted(set(mwes), key=len, reverse=True)) + r")\b", _re.I)

    def in_mwe(r: dict) -> str | None:
        for m in mwe_re.finditer(r["sentence"]):
            if m.start() < r["end"] and m.end() > r["start"]:
                return m.group(0).lower()
        return None

    P(f"{len(set(mwes))} expressions in `mwe_blocklist.txt`. An item is blocked when its span overlaps an occurrence. "
      "PHRASE-rule items are excluded (they are themselves MWEs).\n")
    P("| lang | F2 judged (non-phrase) | F2 wrong | wrong inside MWE | wrong_sense inside MWE | correct inside MWE | F2 precision before -> after blocklist |")
    P("|---|---|---|---|---|---|---|")
    pooled_m = Counter()
    hit_list = Counter()
    for l in LANGS:
        js = [r for r in judged.get(l, []) if r["rule"] not in ("F0-lemma", "PHRASE") and r.get("f2")]
        wrong = [r for r in js if r["label"] != "correct"]
        w_in = [r for r in wrong if in_mwe(r)]
        ws_in = [r for r in w_in if r["label"] == "wrong_sense"]
        c_in = [r for r in js if r["label"] == "correct" and in_mwe(r)]
        for r in w_in:
            hit_list[in_mwe(r)] += 1
        kept = [r for r in js if not in_mwe(r)]
        k_before = len(js) - len(wrong)
        k_after = sum(1 for r in kept if r["label"] == "correct")
        pooled_m.update({"n": len(js), "wrong": len(wrong), "w_in": len(w_in), "ws_in": len(ws_in), "c_in": len(c_in),
                         "kept": len(kept), "k_after": k_after, "k_before": k_before})
        P(f"| {l} | {len(js)} | {len(wrong)} | {len(w_in)} | {len(ws_in)} | {len(c_in)} | {pct(k_before, len(js))} -> {pct(k_after, len(kept))} |")
    pm = pooled_m
    P(f"| **pooled** | {pm['n']} | {pm['wrong']} | {pm['w_in']} | {pm['ws_in']} | {pm['c_in']} | {pct(pm['k_before'], pm['n'])} -> {pct(pm['k_after'], pm['kept'])} |")
    P("\nMost-hit expressions among F2 errors: " + ", ".join(f"{k} ({v})" for k, v in hit_list.most_common(15)) + "\n")
    # corpus-level recall cost
    for l in LANGS:
        f2c = [c for c in cands[l] if c.get("f2") and c["rule"] not in ("PHRASE", "F0-lemma")]
        blocked = sum(1 for c in f2c if in_mwe(c))
        P(f"- {l}: {blocked} of {len(f2c)} F2 candidates ({pct(blocked, len(f2c))}) sit inside a listed MWE "
          f"({100 * blocked / W:.2f} per 100 words).")
    P("")

    args.out_tables.write_text("\n".join(out), encoding="utf-8")
    print(f"wrote {args.out_tables}")


if __name__ == "__main__":
    main()
