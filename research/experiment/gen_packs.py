"""Step 2: generate the target-language pack for one language with `claude -p`.

Usage:
  python3 -I gen_packs.py --lang es --lexicon lexicon.json --out packs/es.json \
      --raw-dir <scratch dir for raw replies> [--batch-size 50] [--model sonnet]

Every batch prompt is built from prompts/pack_gen.txt. Raw replies are kept in
--raw-dir so the run can be audited and resumed (a batch whose raw reply parses
and validates is not re-requested).
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exp_common import extract_json  # noqa: E402

LANG_NAME = {"es": "Spanish", "fr": "French", "de": "German", "it": "Italian", "pt": "Portuguese"}
PRESENT_KEYS = ("1sg", "2sg", "3sg", "1pl", "2pl", "3pl")


def lexicon_items(lex: dict) -> list[dict]:
    items = []
    for r in lex["content"]:
        for p in r["pos"]:
            items.append({"lemma": r["lemma"], "pos": p})
    for r in lex["connectors"]:
        items.append({"lemma": r["lemma"], "pos": "CONJ"})
    for r in lex["phrases"]:
        items.append({"lemma": r["lemma"], "pos": "PHRASE"})
    return items


def validate(entry: dict, lang: str) -> str | None:
    """Return an error string or None when the entry has the required shape."""
    for k in ("lemma", "pos", "target", "dominant_sense_covers_90pct"):
        if k not in entry:
            return f"missing {k}"
    if not isinstance(entry["target"], str) or not entry["target"].strip():
        return "empty target"
    if not isinstance(entry["dominant_sense_covers_90pct"], bool):
        return "dominant flag not bool"
    pos = entry["pos"]
    if pos == "NOUN":
        if entry.get("gender") not in (("m", "f", "n") if lang == "de" else ("m", "f")):
            return f"bad gender {entry.get('gender')!r}"
        if not isinstance(entry.get("plural"), str):
            return "missing plural"
        if not entry["plural"].strip():  # uncountable noun: reuse the singular
            entry["plural"] = entry["target"]
            entry["no_plural"] = True
        if lang == "de" and not entry.get("genitive_sg"):
            entry["genitive_sg"] = entry["target"]
    elif pos == "ADJ":
        f = entry.get("adj_forms")
        if not isinstance(f, dict):
            return "missing adj_forms"
        need = ("base", "stem") if lang == "de" else ("m_sg", "f_sg", "m_pl", "f_pl")
        for k in need:
            if not isinstance(f.get(k), str) or not f[k].strip():
                return f"adj_forms missing {k}"
    elif pos == "VERB":
        pr = entry.get("present")
        if not isinstance(pr, dict):
            return "missing present"
        for k in PRESENT_KEYS:
            if not isinstance(pr.get(k), str) or not pr[k].strip():
                return f"present missing {k}"
        if not entry.get("infinitive"):
            entry["infinitive"] = entry["target"]
    return None


def call_claude(prompt: str, model: str, timeout: int = 600) -> str:
    cmd = ["claude", "-p", prompt, "--model", model, "--output-format", "text"]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if res.returncode != 0:
        raise RuntimeError(f"claude exit {res.returncode}: {res.stderr[:500]}")
    return res.stdout


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", required=True, choices=list(LANG_NAME))
    ap.add_argument("--lexicon", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--raw-dir", required=True, type=Path)
    ap.add_argument("--batch-size", type=int, default=50)
    ap.add_argument("--model", default="sonnet")
    ap.add_argument("--retries", type=int, default=2)
    args = ap.parse_args()

    template = (Path(__file__).resolve().parent / "prompts" / "pack_gen.txt").read_text(encoding="utf-8")
    lex = json.loads(args.lexicon.read_text(encoding="utf-8"))
    items = lexicon_items(lex)
    args.raw_dir.mkdir(parents=True, exist_ok=True)
    batches = [items[i:i + args.batch_size] for i in range(0, len(items), args.batch_size)]
    print(f"{args.lang}: {len(items)} entries in {len(batches)} batches", file=sys.stderr)

    entries: dict[str, dict] = {}
    failures: list[dict] = []
    for bi, batch in enumerate(batches):
        raw_path = args.raw_dir / f"{args.lang}-{bi:02d}.txt"
        want = {(it["lemma"], it["pos"]) for it in batch}
        got: dict[tuple, dict] = {}
        for attempt in range(args.retries + 1):
            if raw_path.exists() and attempt == 0:
                raw = raw_path.read_text(encoding="utf-8")
            else:
                prompt = template.replace("{LANG_NAME}", LANG_NAME[args.lang]).replace(
                    "{ITEMS_JSON}", json.dumps(batch, ensure_ascii=False))
                t0 = time.time()
                try:
                    raw = call_claude(prompt, args.model)
                except Exception as e:  # noqa: BLE001
                    print(f"batch {bi} attempt {attempt}: {e}", file=sys.stderr)
                    continue
                raw_path.write_text(raw, encoding="utf-8")
                print(f"batch {bi} attempt {attempt}: {time.time() - t0:.0f}s", file=sys.stderr)
            try:
                arr = extract_json(raw)
            except ValueError as e:
                print(f"batch {bi} attempt {attempt}: {e}", file=sys.stderr)
                continue
            if isinstance(arr, dict):
                arr = arr.get("entries") or arr.get("items") or [arr]
            for e in arr:
                if not isinstance(e, dict):
                    continue
                key = (str(e.get("lemma", "")).lower(), str(e.get("pos", "")).upper())
                if key in want:
                    err = validate(e, args.lang)
                    if err is None:
                        got[key] = e
                    else:
                        failures.append({"lemma": key[0], "pos": key[1], "error": err, "batch": bi})
            if len(got) == len(want):
                break
            missing = want - set(got)
            print(f"batch {bi}: {len(missing)} missing after attempt {attempt}: {sorted(missing)[:8]}", file=sys.stderr)
            batch = [it for it in batch if (it["lemma"], it["pos"]) in missing]
            # a re-request only asks for the missing ones; drop stale raw so we re-call
            raw_path = args.raw_dir / f"{args.lang}-{bi:02d}-retry{attempt + 1}.txt"
        for key, e in got.items():
            entries[f"{key[0]}|{key[1]}"] = e

    out = {
        "lang": args.lang,
        "model": args.model,
        "n_requested": len(items),
        "n_entries": len(entries),
        "failures": failures,
        "entries": entries,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    dom = sum(1 for e in entries.values() if e["dominant_sense_covers_90pct"])
    print(f"{args.lang}: {len(entries)}/{len(items)} entries, {dom} dominant-sense, {len(failures)} validation failures")


if __name__ == "__main__":
    main()
