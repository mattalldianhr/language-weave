#!/usr/bin/env bash
# Reproduce every number in coverage-report.md.
#
# Usage:
#   bash research/run_all.sh <download-dir> <venv-dir>
#
# <download-dir> must be an empty, untrusted-data directory outside the repo.
# Scripts live in research/ and are run with `python3 -I` so nothing under
# <download-dir> is ever importable.
set -euo pipefail

DL="${1:?download dir}"
VENV="${2:?venv dir}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/data"
mkdir -p "$DL/freq" "$DL/web/wiki" "$DL/web/pages" "$OUT"

# 1. Python environment (wordfreq 3.1.1 with CJK extras: jieba + MeCab/ipadic)
if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet "wordfreq[cjk]"
fi
PY="$VENV/bin/python -I"

# 2. Hermit Dave FrequencyWords, OpenSubtitles 2018, *_full.txt (full vocab,
#    needed for the token denominator). ja has only ja_full; zh is zh_cn.
RAW=https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018
for l in en es fr de it pt zh_cn ja; do
  [ -s "$DL/freq/${l}_full.txt" ] || curl -sSL -o "$DL/freq/${l}_full.txt" "$RAW/$l/${l}_full.txt"
done

# 3. English Wikipedia plaintext extracts (action API, explaintext).
UA="LanguageWeaveResearch/0.1 (vocabulary coverage research)"
for t in Photosynthesis French_Revolution Jazz Basketball Mount_Everest Bitcoin \
         William_Shakespeare Coffee Climate_change "Python_(programming_language)" \
         Elephant Roman_Empire Chess Volcano Internet Sushi Antarctica \
         Ludwig_van_Beethoven Democracy Bicycle; do
  [ -s "$DL/web/wiki/$t.json" ] || curl -sS -A "$UA" -o "$DL/web/wiki/$t.json" \
    "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&formatversion=2&redirects=1&titles=$t"
done

# 4. Ordinary blog/news pages (server-rendered HTML). The NPR/CNN article ids
#    were the front-page items on 2026-10-15; substitute current ones if gone.
declare -A PAGES=(
  [pg_greatwork]="https://paulgraham.com/greatwork.html"
  [ferriss_language]="https://tim.blog/2009/01/20/learning-language/"
  [cnn_neanderthal]="https://lite.cnn.com/2026/10/15/science/neanderthal-fossil-discovery-spear-death"
  [npr_1]="https://text.npr.org/nx-s1-5950023"
  [npr_2]="https://text.npr.org/nx-s1-6001523"
  [npr_3]="https://text.npr.org/nx-s1-6001794"
  [npr_4]="https://text.npr.org/nx-s1-6002957"
)
for k in "${!PAGES[@]}"; do
  [ -s "$DL/web/pages/$k.html" ] || curl -sSL -A "Mozilla/5.0 $UA" -o "$DL/web/pages/$k.html" "${PAGES[$k]}"
done

# 5. Analyses. Each prints a markdown fragment and writes CSV/JSON into data/.
$PY "$HERE/coverage_tables.py" --freq-dir "$DL/freq" --out-dir "$OUT" > "$OUT/out-coverage.md"
$PY "$HERE/ferriss_lists.py"   --freq-dir "$DL/freq" --out-dir "$OUT" > "$OUT/out-ferriss.md"
$PY "$HERE/top300.py"          --freq-dir "$DL/freq" --out-dir "$OUT" > "$OUT/out-top300.md"
$PY "$HERE/exposure.py" --wiki-dir "$DL/web/wiki" --pages-dir "$DL/web/pages" --out-dir "$OUT" > "$OUT/out-exposure.md"
$PY "$HERE/crosslang.py"       --freq-dir "$DL/freq" --out-dir "$OUT" > "$OUT/out-crosslang.md"
echo "done; see $OUT"
