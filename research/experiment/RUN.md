# Run log: deterministic swapper experiment (2026-10-15, code-01)

All paths below use these shell variables:

```bash
E=/home/matt/Personal/projects/language-weave/research/experiment
S=/tmp/claude-1001/-home-matt-Personal-projects-language-weave/e608e518-59cb-484f-8458-a134dcdfc280/scratchpad
PY="$S/venv/bin/python3 -I"      # venv already holds wordfreq 3.1.1
```

Corpus (untrusted, read-only): `$S/data/web/wiki/*.json` (20 Wikipedia extracts) and
`$S/data/web/pages/*.html` (7 news/blog pages; `*_index.html` are skipped). Downloaded by
`research/run_all.sh` earlier the same day.

## 0. Environment

```bash
$S/venv/bin/pip install --quiet --upgrade pip
$S/venv/bin/pip install --quiet spacy nltk unidecode
$S/venv/bin/python3 -m spacy download en_core_web_sm      # 3.8.0
$S/venv/bin/python3 -m spacy download en_core_web_md      # 3.8.0 (reference tagger)
NLTK_DATA=$S/nltk_data $PY -c "import nltk; nltk.download('wordnet', download_dir='$S/nltk_data'); nltk.download('omw-1.4', download_dir='$S/nltk_data')"
$S/venv/bin/pip install --quiet torch --index-url https://download.pytorch.org/whl/cpu   # 2.14.1+cpu
$S/venv/bin/pip install --quiet transformers sentencepiece ctranslate2 sacremoses       # transformers 5.19.0
# Marian models (Helsinki-NLP/opus-mt-en-{es,fr,de}) into $S/hf
HF_HOME=$S/hf $PY -c "from huggingface_hub import snapshot_download; [snapshot_download('Helsinki-NLP/opus-mt-en-'+l) for l in ['es','fr','de']]"
# compromise (JS tagger), scratchpad only
mkdir -p $S/node-tagger && cd $S/node-tagger && npm init -y && npm install compromise   # compromise 14.x, Node 24.21.0
```

Abandoned: `ct2-transformers-converter --quantization int8` produced models that never
emit EOS under transformers 5.19 (degenerate repetition), so F3 uses plain
transformers + torch CPU (about 8-10 sentences/s with beam 2, 4 threads).

Machine: 4 cores, 15 GB RAM (about 7 GB free), no GPU.

## 1. Lexicon

```bash
cd $E && $PY $E/build_lexicon.py --wiki-dir $S/data/web/wiki --pages-dir $S/data/web/pages \
    --nltk-data $S/nltk_data --out $E/lexicon.json          # ~66 s (spaCy md over the corpus)
# -> 500 content lemmas (305 NOUN, 157 VERB, 125 ADJ, 58 ADV entries = 645 lemma+POS),
#    24 connectors, 27 fixed phrases; last kept wordfreq rank 875.
```

## 2. Packs (claude -p, sonnet, 50 items per call)

```bash
mkdir -p $S/exp/packraw $E/packs
for l in es fr de; do
  nohup $PY $E/gen_packs.py --lang $l --lexicon $E/lexicon.json --out $E/packs/$l.json \
      --raw-dir $S/exp/packraw --batch-size 50 --model sonnet > $S/logs/pack-$l.log 2>&1 &
done
```

Prompt template: `prompts/pack_gen.txt`. Raw replies: `$S/exp/packraw/<lang>-<batch>.txt`.
A second pass with the same command re-parses saved replies and only re-requests
entries that are still missing (the first pass ran before `extract_json` tolerated
control characters in strings).

Pack outcome: es/fr/de 696/696 entries each (645 lemma+POS + 24 connectors + 27 phrases).
A stray `"` inside one reply broke a whole 50-item array; `extract_json` now salvages
each parsable object by brace matching and only the broken entry is re-requested.

## 3-4. Swapper and filters F0-F2

```bash
mkdir -p $S/exp/run
cd $E && $PY $E/swapper.py --wiki-dir $S/data/web/wiki --pages-dir $S/data/web/pages \
    --lexicon $E/lexicon.json --packs-dir $E/packs --out-dir $S/exp/run --langs es,fr,de
# (fr,de were run first while the es pack finished; es was added with --langs es.
#  The parse is deterministic so sentences.jsonl and cids are identical across runs.)
# -> $S/exp/run/{sentences.jsonl, candidates-<lang>.jsonl, skips-<lang>.json, stats.json}
```

## 4. F3 NMT verification (sequential, 4 threads, ~10 sentences/s)

```bash
for l in fr de es; do
  $PY $E/nmt_verify.py --run-dir $S/exp/run --lang $l --hf-home $S/hf --batch 24 --beams 2 --threads 4 \
      > $S/logs/nmt-$l.log 2>&1
done
# annotates candidates-<lang>.jsonl in place with nmt_pass / f3 / f1_nmt; cache in nmt-<lang>.jsonl
```

## 5. Sampling and judging

```bash
mkdir -p $E/samples $E/judged $S/exp/judgeraw
for l in es fr de; do
  $PY $E/sample.py --run-dir $S/exp/run --lang $l --out $E/samples/$l.jsonl --seed 7
  nohup $PY $E/judge.py --lang $l --sample $E/samples/$l.jsonl --out $E/judged/$l.jsonl \
      --raw-dir $S/exp/judgeraw --model sonnet --batch-size 20 > $S/logs/judge-$l.log 2>&1 &
done
# reliability: first 100 Spanish items re-judged with opus
$PY $E/judge.py --lang es --sample $E/samples/es.jsonl --out $E/judged/es-opus.jsonl \
    --raw-dir $S/exp/judgeraw --model opus --batch-size 20 --limit 100 --tag opus
```

Sample per language: 440 items = N-adj 20, N-det 50, N-bare 50, ADJ-pred 60, ADV 50,
CONN 50, V-inf 50, V-pres 50, PHRASE 20, F0-only 40. Prompt: `prompts/judge.txt`.

## 6. Tagger comparison

```bash
cd $E && NODE_PATH=$S/node-tagger/node_modules node $E/tag_compromise.js \
    $S/exp/run/sentences.jsonl $S/exp/run/compromise.jsonl 2> $S/exp/run/compromise-timing.json
$PY $E/tagger_compare.py --run-dir $S/exp/run --judged-dir $E/judged \
    --compromise $S/exp/run/compromise.jsonl --out $S/exp/run/tagger.json
```

Throughput was measured once on an idle machine (spaCy md 4,475 words/s during the
lexicon/dry run; compromise 15,942 words/s) and once under load (3,337 and 4,696 words/s
while NMT and judging were running). The idle numbers are the ones reported.

## 7. Report tables

```bash
$PY $E/report.py --run-dir $S/exp/run --packs-dir $E/packs --lexicon $E/lexicon.json \
    --judged-dir $E/judged --tagger $S/exp/run/tagger.json --opus $E/judged/es-opus.jsonl \
    --out-tables $E/tables.md
```

### NMT restructure (what actually ran)

The full-corpus pass (8,592 F1 sentences per language at 2.6-4 sentences/s on 4 cores)
would have taken ~2.7 h, so it was stopped after 2,688 French sentences (kept in the
cache) and replaced by a judged-first pass plus a seeded random subset:

```bash
for l in fr de es; do
  $PY $E/nmt_verify.py --run-dir $S/exp/run --lang $l --hf-home $S/hf --batch 24 --beams 2 --threads 4 \
      --judged-dir $E/judged --subset 2500 --seed 7 > $S/logs/nmt2-$l.log 2>&1
done
# every judged item's sentence is translated (precision at F3 is exact for the sample);
# F3 retained-per-100-words is estimated on the 2,500-sentence subset (word-scaled);
# add --full to translate the remaining F1 sentences (cache is resumable).
```

Judge prompt revision: the first French/German judging pass (raw replies archived in
`$S/exp/judgeraw-v1/`) penalized English prepositions left outside the swapped span
("in le système naturel"), which is inherent to a diglot weave. `prompts/judge.txt` was
tightened (judge the span only; the surrounding English is by design) and fr/de were
re-judged from scratch; es and the opus re-judge used the revised prompt from the start.

## 8. Coordinator follow-ups (conservative configuration, per-lemma, MWE blocklist)

```bash
# every judged F2 item in the conservative configuration (CONN, ADV, N-det, N-adj; de NOM/ACC)
$PY $E/cons_sample.py --judged-dir $E/judged --out-dir $E/samples     # -> samples/cons-{es,fr,de}.jsonl (115/108/100 items)
for l in es fr de; do
  nohup $PY $E/judge.py --lang $l --sample $E/samples/cons-$l.jsonl --out $E/judged/cons-opus-$l.jsonl \
      --raw-dir $S/exp/judgeraw --model opus --batch-size 20 --tag cons > $S/logs/judge-cons-$l.log 2>&1 &
done
# per-lemma table (per-lemma.csv) and the MWE analysis (mwe_blocklist.txt) are produced by report.py
```

## 9. Final assembly

```bash
$PY $E/report.py --run-dir $S/exp/run --packs-dir $E/packs --lexicon $E/lexicon.json \
    --judged-dir $E/judged --tagger $S/exp/run/tagger.json --opus $E/judged/es-opus.jsonl \
    --out-tables $E/tables.md                                   # tables.md + per-lemma.csv
$PY $E/fill_report.py --run-dir $S/exp/run --judged-dir $E/judged --template $E/report-template.md \
    --decision $E/decision.md --out $E/../experiment-deterministic.md
```

`report-template.md` holds the narrative with `@@...@@` markers for every F3-dependent
number; `fill_report.py` computes those from the judged and candidate files and injects
`decision.md`.

NMT outcome: translated sentences fr 4,253 (incl. 2,688 from the aborted full pass), de 2,224,
es 2,235; judged sentences 432/432/424 all translated; random subset 2,500 sentences =
48,984 words, all 1,901 F1 sentences in it translated, beam 2. Candidate files carry
`nmt_pass`, `f3`, `f1_nmt`, `in_subset`, `nmt_done`, `mt`.
