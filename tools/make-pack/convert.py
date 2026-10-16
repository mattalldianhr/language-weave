"""Convert an experiment pack (research/experiment/packs/<lang>.json) into an extension pack.

Usage:
  python3 -I tools/make-pack/convert.py --lang es \
      --experiment research/experiment --out extension/packs/es.json [--revision 2026-10-16.1]

Reads from --experiment: packs/<lang>.json, lexicon.json, per-lemma.csv, mwe_blocklist.txt.
Schema: docs/superpowers/specs/2026-10-16-extension-design.md §4.

Tier (introduction order, literature items 13-14): 1 = connectors and cognates; 2 = nouns and
adjectives; 3 = adverbs and verbs. Within a tier the scheduler orders by wordfreq rank.
"""
from __future__ import annotations

import argparse
import csv
import json
import unicodedata
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

NAMES = {"es": "Spanish", "fr": "French", "de": "German", "it": "Italian", "pt": "Portuguese"}
CLASS_OF_POS = {"CONJ": "conn", "ADV": "adv", "NOUN": "noun", "ADJ": "adj", "VERB": "verb", "PHRASE": "phrase"}
# Adverbs and connectors the experiment found wrong more often than not (experiment §Decision 3).
ALWAYS_DROP = ["long|ADV", "too|ADV", "ago|ADV", "yet|ADV", "yet|CONJ", "even|ADV", "especially|ADV",
               "especially|CONJ", "anyway|ADV", "anyway|CONJ"]
PRENOMINAL = {
    "es": {"big", "good", "bad", "new", "old", "great", "small", "little", "young", "long", "first", "last", "only",
           "same", "other", "such", "next", "whole", "main", "high", "low", "best", "worst", "own"},
    "fr": {"big", "good", "bad", "new", "old", "beautiful", "young", "small", "little", "long", "great", "first",
           "last", "only", "same", "other", "next", "whole", "main", "best", "worst", "own", "high", "large"},
    "it": {"big", "good", "bad", "new", "old", "beautiful", "young", "small", "little", "great", "first", "last",
           "only", "same", "other", "next", "whole", "main", "best", "worst", "own"},
    "pt": {"good", "bad", "new", "old", "great", "small", "little", "first", "last", "only", "same", "other",
           "next", "whole", "main", "best", "worst", "own"},
}


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def similarity(a: str, b: str) -> float:
    """Levenshtein ratio on accent-stripped, lower-cased strings."""
    a, b = strip_accents(a), strip_accents(b)
    if not a or not b:
        return 0.0
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return 1 - prev[-1] / max(len(a), len(b))


def is_cognate(english: str, target: str) -> bool:
    head = target.split()[-1] if target else ""
    return len(english) >= 4 and similarity(english, head) >= 0.7


def load_ranks(lexicon: dict) -> dict[str, int]:
    ranks: dict[str, int] = {}
    for r in lexicon.get("content", []):
        ranks[r["lemma"]] = r.get("wordfreq_rank") or 10**6
    for r in lexicon.get("connectors", []):
        ranks.setdefault(r["lemma"], r.get("wordfreq_rank") or 10**6)
    return ranks


CONSERVATIVE_RULES = {"CONN-tok", "ADV-tok", "N-det", "N-adj"}


def load_drop(exp: Path, lang: str) -> list[str]:
    """Entries to hide from the rule layer.

    Two sources. (1) per-lemma.csv, computed over every experiment rule, for classes the rule layer
    never uses (verbs, adjectives on their own): those entries reach the page only as verifier
    extras, so a lemma that failed under half the time anywhere is not worth offering. (2) The
    judged files restricted to the conservative rules, for every class: nouns like "part" or "way"
    fail as bare nouns (N-bare, not shipped) but hold up with their article (N-det), so the rule
    layer's own record decides for them.
    """
    out: set[str] = set()
    with (exp / "per-lemma.csv").open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            cls = row["class"].upper()
            if cls not in ("VERB", "ADJ"):
                continue
            if int(row["n"]) >= 5 and float(row["rate"]) < 0.5:
                out.add(f"{row['lemma']}|{cls}")
    stats: dict[str, list[int]] = {}
    for name in (f"{lang}.jsonl", f"cons-opus-{lang}.jsonl"):
        path = exp / "judged" / name
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            r = json.loads(line)
            if r.get("rule") not in CONSERVATIVE_RULES or not r.get("f2"):
                continue
            for key in r.get("pack_keys", []):
                s = stats.setdefault(key, [0, 0])
                s[0] += 1
                s[1] += r.get("label") == "correct"
    for key, (n, c) in stats.items():
        if n >= 4 and c / n < 0.5:
            out.add(key)
    return sorted(out)


def load_blocklist(path: Path) -> list[str]:
    lines = [l.strip() for l in path.read_text(encoding="utf-8").splitlines()]
    return sorted({l for l in lines if l and not l.startswith("#")})


def convert_entry(lang: str, key: str, e: dict, ranks: dict[str, int]) -> dict | None:
    lemma, pos = key.split("|")
    cls = CLASS_OF_POS.get(pos)
    if cls is None or cls == "phrase":
        return None
    target = (e.get("target") or "").strip()
    if not target:
        return None
    forms: dict
    if cls == "noun":
        if not e.get("gender") or not e.get("plural"):
            return None
        forms = {"gender": e["gender"], "sg": target, "pl": e["plural"]}
        if lang == "de":
            forms["gen_sg"] = e.get("genitive_sg") or target
            forms["dat_pl"] = e.get("dative_pl") or e["plural"]
    elif cls == "adj":
        af = e.get("adj_forms") or {}
        if lang == "de":
            forms = {"base": af.get("base") or target, "stem": af.get("stem") or af.get("base") or target, "prenominal": True}
        else:
            if not all(af.get(k) for k in ("m_sg", "f_sg", "m_pl", "f_pl")):
                return None
            forms = {k: af[k] for k in ("m_sg", "f_sg", "m_pl", "f_pl")}
            forms["prenominal"] = bool(e.get("prenominal")) or lemma in PRENOMINAL.get(lang, set())
    elif cls == "verb":
        present = e.get("present") or {}
        if not all(present.get(k) for k in ("1sg", "2sg", "3sg", "1pl", "2pl", "3pl")):
            return None
        forms = {"inf": e.get("infinitive") or target, "present": {k: present[k] for k in ("1sg", "2sg", "3sg", "1pl", "2pl", "3pl")}}
        if e.get("reflexive"):
            forms["reflexive"] = True
    else:
        forms = {"word": target}
    cognate = is_cognate(lemma, target)
    tier = 1 if cls == "conn" or cognate else 2 if cls in ("noun", "adj") else 3
    out = {
        "target": target,
        "sense": (e.get("english_sense") or "").strip() or lemma,
        "dominant": bool(e.get("dominant_sense_covers_90pct")),
        "note": (e.get("ambiguity_note") or "").strip(),
        "class": cls,
        "tier": tier,
        "rank": int(ranks.get(lemma, 10**6)),
        "forms": forms,
    }
    if cognate:
        out["cognate"] = True
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", required=True, choices=sorted(NAMES))
    ap.add_argument("--experiment", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--pack", type=Path, help="experiment pack path (default: <experiment>/packs/<lang>.json)")
    ap.add_argument("--revision", default="")
    a = ap.parse_args()

    exp = a.experiment
    src = a.pack or (exp / "packs" / f"{a.lang}.json")
    raw = json.loads(src.read_text(encoding="utf-8"))
    lexicon = json.loads((exp / "lexicon.json").read_text(encoding="utf-8"))
    ranks = load_ranks(lexicon)
    drop = sorted(set(load_drop(exp, a.lang)) | set(ALWAYS_DROP))
    blocklist = load_blocklist(exp / "mwe_blocklist.txt")

    entries = {}
    skipped = 0
    for key, e in raw["entries"].items():
        c = convert_entry(a.lang, key, e, ranks)
        if c is None:
            skipped += 1
            continue
        entries[key] = c
    today = datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")
    pack = {
        "lang": a.lang,
        "name": NAMES[a.lang],
        "revision": a.revision or f"{today}.1",
        "source": f"research/experiment packs ({raw.get('model', 'unknown')} model), converted by tools/make-pack/convert.py on {today}",
        "blocklist": blocklist,
        "drop": [k for k in drop if k in entries],
        "entries": dict(sorted(entries.items())),
    }
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(pack, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    by_class = {}
    for e in entries.values():
        by_class[e["class"]] = by_class.get(e["class"], 0) + 1
    print(f"{a.lang}: {len(entries)} entries ({by_class}), {skipped} skipped, {len(pack['drop'])} dropped, {len(blocklist)} blocked phrases -> {a.out}")


if __name__ == "__main__":
    main()
