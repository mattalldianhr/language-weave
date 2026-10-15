"""Step 5b: judge sampled swaps with `claude -p`, 20 items per call.

Usage:
  python3 -I judge.py --lang es --sample samples/es.jsonl --out judged/es.jsonl \
      --raw-dir <scratch dir> [--model sonnet] [--batch-size 20] [--limit N] [--tag opus]

Writes one line per judged item: the full candidate record plus
{"label", "reason", "judge_model"}. Raw replies are kept in --raw-dir (resumable).
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exp_common import extract_json, read_jsonl, write_jsonl  # noqa: E402

LANG_NAME = {"es": "Spanish", "fr": "French", "de": "German"}
LABELS = {"correct", "wrong_sense", "wrong_gender", "wrong_number", "wrong_case", "wrong_conjugation",
          "wrong_order_or_awkward", "should_not_swap_other"}


def call_claude(prompt: str, model: str, timeout: int = 600) -> str:
    res = subprocess.run(["claude", "-p", prompt, "--model", model, "--output-format", "text"],
                         capture_output=True, text=True, timeout=timeout)
    if res.returncode != 0:
        raise RuntimeError(f"claude exit {res.returncode}: {res.stderr[:400]}")
    return res.stdout


def item_view(c: dict) -> dict:
    return {"id": c["cid"], "original": c["sentence"], "swapped": c["swapped"],
            "swap": f"\"{c['english']}\" -> \"{c['target']}\"", "gloss": c["gloss"]}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", required=True, choices=list(LANG_NAME))
    ap.add_argument("--sample", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--raw-dir", required=True, type=Path)
    ap.add_argument("--model", default="sonnet")
    ap.add_argument("--batch-size", type=int, default=20)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--tag", default="", help="suffix for raw files (e.g. opus re-judge)")
    ap.add_argument("--retries", type=int, default=2)
    args = ap.parse_args()

    template = (Path(__file__).resolve().parent / "prompts" / "judge.txt").read_text(encoding="utf-8")
    items = read_jsonl(args.sample)
    if args.limit:
        items = items[: args.limit]
    args.raw_dir.mkdir(parents=True, exist_ok=True)
    batches = [items[i:i + args.batch_size] for i in range(0, len(items), args.batch_size)]
    judged: dict[str, dict] = {}
    for bi, batch in enumerate(batches):
        tag = f"-{args.tag}" if args.tag else ""
        raw_path = args.raw_dir / f"judge-{args.lang}{tag}-{bi:03d}.txt"
        want = {c["cid"] for c in batch}
        got: dict[str, dict] = {}
        pending = batch
        for attempt in range(args.retries + 1):
            path = raw_path if attempt == 0 else raw_path.with_name(raw_path.stem + f"-retry{attempt}.txt")
            if path.exists():
                raw = path.read_text(encoding="utf-8")
            else:
                prompt = template.replace("{LANG_NAME}", LANG_NAME[args.lang]).replace(
                    "{ITEMS_JSON}", json.dumps([item_view(c) for c in pending], ensure_ascii=False, indent=0))
                t0 = time.time()
                try:
                    raw = call_claude(prompt, args.model)
                except Exception as e:  # noqa: BLE001
                    print(f"batch {bi} attempt {attempt}: {e}", file=sys.stderr)
                    continue
                path.write_text(raw, encoding="utf-8")
                print(f"batch {bi} attempt {attempt}: {time.time() - t0:.0f}s", file=sys.stderr)
            try:
                arr = extract_json(raw)
            except ValueError as e:
                print(f"batch {bi} attempt {attempt}: {e}", file=sys.stderr)
                continue
            if isinstance(arr, dict):
                arr = arr.get("items") or arr.get("results") or [arr]
            for r in arr:
                if not isinstance(r, dict):
                    continue
                cid = str(r.get("id", ""))
                label = str(r.get("label", "")).strip().lower()
                if cid in want and label in LABELS:
                    got[cid] = {"label": label, "reason": str(r.get("reason", ""))[:300]}
            if len(got) == len(want):
                break
            pending = [c for c in batch if c["cid"] not in got]
            print(f"batch {bi}: {len(pending)} unjudged after attempt {attempt}", file=sys.stderr)
        for c in batch:
            if c["cid"] in got:
                rec = dict(c)
                rec.pop("nmt_forms", None)
                rec.update(got[c["cid"]])
                rec["judge_model"] = args.model
                judged[c["cid"]] = rec
    rows = [judged[c["cid"]] for c in items if c["cid"] in judged]
    write_jsonl(args.out, rows)
    from collections import Counter
    print(f"{args.lang} ({args.model}): {len(rows)}/{len(items)} judged; labels: {dict(Counter(r['label'] for r in rows))}")


if __name__ == "__main__":
    main()
