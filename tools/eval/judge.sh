#!/usr/bin/env bash
# Judges tools/eval samples with research/experiment/judge.py (claude -p, 20 items per call).
# Usage: tools/eval/judge.sh <samples-dir> <lang> <tier> [model]
set -euo pipefail
DIR="$1"; LANG_="$2"; TIER="$3"; MODEL="${4:-sonnet}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RAW="${DIR}/raw-${LANG_}-${TIER}"
mkdir -p "$RAW"
python3 -I "$ROOT/research/experiment/judge.py" --lang "$LANG_" \
  --sample "$DIR/${LANG_}-${TIER}.jsonl" --out "$DIR/${LANG_}-${TIER}.judged.jsonl" \
  --raw-dir "$RAW" --model "$MODEL"
