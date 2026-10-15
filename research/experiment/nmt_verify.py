"""Step 4, filter F3: NMT verification of candidates with opus-mt (Marian) on CPU.

Usage:
  python3 -I nmt_verify.py --run-dir R --lang es --hf-home H [--batch 24] [--beams 2] [--threads 4]

Translates every sentence that holds at least one F1 candidate (cached in
R/nmt-<lang>.jsonl, resumable), then annotates R/candidates-<lang>.jsonl in place:
  nmt_pass         any inflected pack form of EVERY swapped target word appears as a
                   whole token in the MT output (lowercase, accent-insensitive)
  nmt_pass_relaxed same, but a German form may also be the tail of a longer token
                   (compound nouns such as Kaffeebohnen ~ Bohnen)
  f3               f2 and nmt_pass
  f1_nmt           f1 and nmt_pass (NMT check without the dominant-sense flag)
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exp_common import norm, read_jsonl, write_jsonl  # noqa: E402

MODEL = {"es": "Helsinki-NLP/opus-mt-en-es", "fr": "Helsinki-NLP/opus-mt-en-fr", "de": "Helsinki-NLP/opus-mt-en-de"}
_SPLIT = re.compile(r"[^a-z0-9]+")


def mt_tokens(text: str) -> list[str]:
    return [t for t in _SPLIT.split(norm(text).replace("'", " ")) if t]


def form_present(form: str, toks: list[str], tokset: set[str], relaxed: bool) -> bool:
    f = norm(form).replace("'", " ").strip()
    parts = [p for p in _SPLIT.split(f) if p]
    if not parts:
        return False
    if len(parts) > 1:
        joined = " " + " ".join(toks) + " "
        return (" " + " ".join(parts) + " ") in joined
    p = parts[0]
    if p in tokset:
        return True
    if relaxed and len(p) >= 4:
        return any(t.endswith(p) and len(t) > len(p) for t in toks)
    return False


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-dir", required=True, type=Path)
    ap.add_argument("--lang", required=True, choices=list(MODEL))
    ap.add_argument("--hf-home", required=True, type=Path)
    ap.add_argument("--batch", type=int, default=24)
    ap.add_argument("--beams", type=int, default=2)
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--max-sentences", type=int, default=0, help="debug: translate only the first N")
    ap.add_argument("--judged-dir", type=Path, help="translate sentences of judged items first")
    ap.add_argument("--subset", type=int, default=0, help="random subset of sentences (seeded) for the recall estimate")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--full", action="store_true", help="also translate every remaining F1 sentence")
    args = ap.parse_args()

    import os
    os.environ["HF_HOME"] = str(args.hf_home)
    os.environ["HF_HUB_OFFLINE"] = "1"
    import torch
    from transformers import MarianMTModel, MarianTokenizer
    torch.set_num_threads(args.threads)

    cand_path = args.run_dir / f"candidates-{args.lang}.jsonl"
    cands = read_jsonl(cand_path)
    sents = {s["sid"]: s["text"] for s in read_jsonl(args.run_dir / "sentences.jsonl")}
    all_f1 = sorted({c["sid"] for c in cands if c["f1"]}, key=lambda s: len(sents[s]))
    judged_sids: set[str] = set()
    if args.judged_dir:
        jp = args.judged_dir / f"{args.lang}.jsonl"
        if jp.exists():
            judged_sids = {r["sid"] for r in read_jsonl(jp)}
    import random
    subset_sids: set[str] = set()
    if args.subset:
        rng = random.Random(args.seed)
        all_sids = sorted(sents)  # subset over ALL sentences so word totals are unbiased
        subset_sids = set(rng.sample(all_sids, min(args.subset, len(all_sids))))
    if args.judged_dir or args.subset:
        need = [s for s in all_f1 if s in judged_sids] + [s for s in all_f1 if s in subset_sids and s not in judged_sids]
        if args.full:
            done_set = set(need)
            need += [s for s in all_f1 if s not in done_set]
    else:
        need = list(all_f1)
    if args.max_sentences:
        need = need[: args.max_sentences]
    cache_path = args.run_dir / f"nmt-{args.lang}.jsonl"
    cache: dict[str, str] = {}
    if cache_path.exists():
        for r in read_jsonl(cache_path):
            cache[r["sid"]] = r["mt"]
    todo = [s for s in need if s not in cache]
    print(f"{args.lang}: {len(need)} sentences needed, {len(todo)} to translate", file=sys.stderr)

    if todo:
        tok = MarianTokenizer.from_pretrained(MODEL[args.lang])
        model = MarianMTModel.from_pretrained(MODEL[args.lang]).eval()
        t0 = time.time()
        done = 0
        with cache_path.open("a", encoding="utf-8") as fh, torch.inference_mode():
            for i in range(0, len(todo), args.batch):
                chunk = todo[i:i + args.batch]
                texts = [sents[s] for s in chunk]
                b = tok(texts, return_tensors="pt", padding=True, truncation=True, max_length=256)
                out = model.generate(**b, num_beams=args.beams, max_new_tokens=300)
                res = tok.batch_decode(out, skip_special_tokens=True)
                for sid, mt in zip(chunk, res):
                    cache[sid] = mt
                    fh.write(json.dumps({"sid": sid, "mt": mt}, ensure_ascii=False) + "\n")
                fh.flush()
                done += len(chunk)
                if (i // args.batch) % 20 == 0:
                    el = time.time() - t0
                    print(f"  {done}/{len(todo)}  {done / el:.1f} sent/s", file=sys.stderr)
        print(f"translated {done} in {time.time() - t0:.0f}s", file=sys.stderr)

    n_pass = n_f3 = n_f1 = 0
    for c in cands:
        c["nmt_done"] = c["sid"] in cache
        c["in_subset"] = c["sid"] in subset_sids
        if not c["f1"] or c["sid"] not in cache:
            c["nmt_pass"] = c["nmt_pass_relaxed"] = c["f3"] = c["f1_nmt"] = False
            continue
        toks = mt_tokens(cache[c["sid"]])
        tokset = set(toks)
        strict = all(any(form_present(f, toks, tokset, False) for f in forms) for forms in c["nmt_forms"])
        relaxed = all(any(form_present(f, toks, tokset, args.lang == "de") for f in forms) for forms in c["nmt_forms"])
        c["nmt_pass"] = strict
        c["nmt_pass_relaxed"] = relaxed
        c["f1_nmt"] = strict
        c["f3"] = bool(c["f2"] and strict)
        c["mt"] = cache[c["sid"]]
        n_f1 += 1
        n_pass += strict
        n_f3 += c["f3"]
    write_jsonl(cand_path, cands)
    sub_words = sum(s["n_words"] for s in read_jsonl(args.run_dir / "sentences.jsonl") if s["sid"] in subset_sids)
    (args.run_dir / f"nmt-meta-{args.lang}.json").write_text(json.dumps({
        "translated_sentences": len(cache), "judged_sentences": len(judged_sids),
        "subset_sentences": len(subset_sids), "subset_words": sub_words,
        "subset_translated": sum(1 for s in subset_sids if s in cache or s not in set(all_f1)),
        "subset_f1_sentences": sum(1 for s in subset_sids if s in set(all_f1)),
        "subset_f1_sentences_translated": sum(1 for s in subset_sids if s in set(all_f1) and s in cache),
        "beams": args.beams}), encoding="utf-8")
    print(f"{args.lang}: f1={n_f1} nmt_pass={n_pass} f3={n_f3} translated={len(cache)}")


if __name__ == "__main__":
    main()
