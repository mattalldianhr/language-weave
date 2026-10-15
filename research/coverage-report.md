# Language Weave: word-frequency coverage report

Date: 2026-10-15 (America/New_York). Computed on code-01 from downloaded data.
Every number below was produced by the scripts in this directory. Nothing is
quoted from memory. Where a figure could not be computed, the text says so.

## Headline numbers

| question | answer |
|---|---|
| Ferriss: "first 25 words = ~1/3 of printed English" | Roughly holds. Corpus-own top-25: 34.9% (OpenSubtitles), 31.1% (wordfreq blend). Ferriss's own first 25: 30.2% / 30.7%. |
| Ferriss: "first 100 = 1/2" | Holds for speech-like text only. Corpus-own top-100: 58.2% (subtitles), 46.0% (blend). Ferriss written-100: 48.0% / 44.2%. |
| Ferriss: "first 300 = ~65%" | Overstated for written web text. Corpus-own top-300: 71.9% (subtitles), 56.7% (blend). |
| English top-1000 | 82.7% (subtitles), 68.8% (blend). |
| Ferriss union (143 words) on real web prose | 42.3 of every 100 running words. Only 5.7 per 100 once pure grammar words are removed. |
| wordfreq English top-300 on real web prose | 47.9 per 100 words; 10.1 per 100 after removing grammar words. |
| Cross-language agreement (top-100 of target vs English top-300) | es 92, fr 90, de 85, pt 85, it 83, zh 74, ja 49 out of 100 (model-judged glosses). |

## Method

### Sources

1. **OpenSubtitles 2018** via Hermit Dave's FrequencyWords repository,
   `content/2018/<lang>/<lang>_full.txt` (full vocabulary, "word count" per
   line). The `_full` file is used, not `_50k`, so the denominator is the
   whole token stream. Japanese has no `_50k` file; Chinese lives under
   `zh_cn`.
2. **wordfreq 3.1.1** (Robyn Speer), installed with the `[cjk]` extra
   (jieba for Chinese, MeCab + ipadic for Japanese). Wordlist "best"
   (= "large" for all eight languages). It blends subtitles, Wikipedia,
   news, books, and web text.

### Coverage computation

* **OpenSubtitles:** `coverage(N) = sum(count of top-N words) / total word
  tokens in *_full.txt`. Lines are sorted by count. Pure-punctuation
  tokens are dropped from both numerator and denominator (only Japanese
  had any: 355,252 tokens of 、。（）「」). For Chinese, Latin-script
  tokens (English words leaking from bilingual subtitles: `you`, `i`,
  `the`, `l`, `s`) were also dropped: 7,201,299 tokens, 8.4% of the file.
* **wordfreq:** `coverage(N) = sum(word_frequency(w, lang) for w in
  top_n_list(lang, N))`. wordfreq frequencies are smoothed estimates
  normalised per billion words, blended across corpora, and binned on a
  log scale, so they are not raw counts. The sum over the top 50,000
  words is 0.92 to 1.00 per language (en 0.955, es 0.952, fr 0.957,
  de 0.921, it 0.952, pt 0.960, ja 0.964, zh 0.995), so the figures are
  coverage relative to wordfreq's own normalisation and may understate
  true coverage by a few points, most for German.

### Tokenization differences that matter

* OpenSubtitles English splits clitics: `it's` becomes `it` + `'s`,
  `don't` becomes `don` + `'t`. So `'s` is rank 6 and `'t` rank 10, and
  `it`, `i`, `do` absorb their contracted uses.
* wordfreq keeps contractions whole (`it's`, `don't`, `i'm` are tokens).
* **Japanese:** wordfreq segments with MeCab into morphemes. Particles
  (の, は, が) and inflection fragments (た, て, ます) are separate
  "words", so Japanese top-N coverage is inflated by grammatical
  morphemes and is not comparable word-for-word with the European lists.
  The OpenSubtitles Japanese file is worse: it is tiny (3.4M tokens vs
  735M for English), has had particles stripped entirely (の/は/が do
  not appear), and stores verbs as stems (言, 知, 分か). Its coverage
  curve is reported but should not be used for design decisions.
* **Chinese:** wordfreq segments with jieba. Segmentation choices (这是
  as one token vs 这 + 是) shift coverage by a few points. OpenSubtitles
  zh_cn appears to be segmented similarly (我们, 知道, 什么 are single
  tokens).

### Ferriss list handling

Copied verbatim from the brief. The written list has 100 entries. The
spoken list as given has **99** entries, not 100. Entries were expanded:
`a/an` to a, an; `either/or` to either, or; `there is` to there, is;
`thank you` to thank, you; `I` lowercased to `i`. Result: written 100
words, spoken 101 words, union 143 after dedupe.

## 1. Cumulative token coverage of the top-N words

### 1a. OpenSubtitles 2018 (%)

| top-N | en | es | fr | de | it | pt | ja* | zh |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 25 | 34.9 | 33.9 | 33.8 | 30.4 | 28.9 | 32.6 | 23.6 | 32.5 |
| 50 | 46.7 | 42.2 | 45.9 | 40.8 | 37.9 | 40.7 | 32.4 | 40.4 |
| 100 | 58.2 | 50.7 | 56.7 | 51.4 | 47.0 | 49.8 | 41.9 | 48.1 |
| 200 | 67.4 | 59.1 | 65.1 | 61.0 | 56.6 | 58.8 | 52.6 | 56.0 |
| 300 | 71.9 | 63.5 | 69.1 | 65.7 | 61.8 | 63.4 | 59.2 | 60.4 |
| 500 | 77.1 | 68.6 | 73.8 | 71.2 | 67.7 | 68.6 | 67.7 | 65.3 |
| 1000 | 82.7 | 74.9 | 79.4 | 77.6 | 74.7 | 75.0 | 78.3 | 71.6 |
| 2000 | 87.4 | 80.6 | 84.5 | 82.9 | 80.8 | 80.9 | 87.1 | 77.5 |
| 3000 | 89.8 | 83.8 | 87.1 | 85.6 | 84.0 | 84.0 | 91.1 | 80.7 |
| 5000 | 92.4 | 87.4 | 90.1 | 88.6 | 87.7 | 87.6 | 94.9 | 84.5 |

\* ja: particles stripped at source, 3.4M tokens; not comparable.

Corpus sizes (word tokens after cleaning): en 734.8M, es 423.3M,
fr 318.2M, de 156.2M, it 247.1M, pt 217.0M, ja 3.4M, zh 78.3M.

### 1b. wordfreq 3.1.1 "best" lists (%)

| top-N | en | es | fr | de | it | pt | ja | zh |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 25 | 31.1 | 39.9 | 35.7 | 27.7 | 32.0 | 34.9 | 38.3 | 20.6 |
| 50 | 38.4 | 45.2 | 45.2 | 36.8 | 39.1 | 41.1 | 44.9 | 26.4 |
| 100 | 46.0 | 50.2 | 52.6 | 45.0 | 45.8 | 47.3 | 51.3 | 33.0 |
| 200 | 53.0 | 55.7 | 58.4 | 51.5 | 52.2 | 53.6 | 57.0 | 40.2 |
| 300 | 56.7 | 59.0 | 61.7 | 55.3 | 55.9 | 57.3 | 60.2 | 44.8 |
| 500 | 61.7 | 63.2 | 65.9 | 59.8 | 60.6 | 62.0 | 64.5 | 51.1 |
| 1000 | 68.8 | 69.2 | 71.6 | 65.8 | 67.2 | 68.8 | 70.6 | 59.9 |
| 2000 | 76.1 | 75.3 | 77.5 | 71.7 | 73.8 | 75.5 | 77.0 | 68.9 |
| 3000 | 80.1 | 78.7 | 80.8 | 75.1 | 77.5 | 79.2 | 80.7 | 73.8 |
| 5000 | 84.7 | 82.8 | 84.7 | 79.1 | 82.0 | 83.6 | 85.0 | 79.4 |

Reading the two tables together:

* Speech (subtitles) is far more concentrated than blended written text.
  English top-100 covers 58.2% of subtitle tokens but 46.0% of the
  blend. The gap persists to top-5000 (92.4% vs 84.7%).
* Romance languages on the blend are slightly *more* concentrated than
  English at the top (fr 52.6%, es 50.2% at top-100 vs en 46.0%)
  because articles and prepositions fuse and inflect (de, la, le, les,
  des, du...). German is the least concentrated European language.
* Chinese is the outlier: top-100 covers only 33.0% on wordfreq. Jieba
  produces many multi-character words and Chinese has few articles or
  inflections, so frequency mass is spread wider.
* Japanese (wordfreq) looks concentrated (51.3% at top-100) only because
  the "words" are morphemes; about 40 of its top-100 are particles or
  inflection fragments with no English word equivalent (section 6).

## 2. Ferriss's two lists against the English corpora

### Sizes and membership

* Written: 100 entries, 100 words. Spoken: 99 entries, 101 words.
  Union after dedupe: **143** words. Shared by both lists: 58.
* Only in written (42): it, was, are, as, his, at, be, had, by, word,
  were, said, each, do, will, about, these, her, would, him, into, has,
  look, two, write, number, way, could, than, water, been, call, oil,
  its, long, down, day, did, get, made, may, part.
* Only in spoken (43): after, again, almost, also, always, because,
  before, big, either, friend, good, goodbye, happy, hello, here, am,
  know, last, little, love, most, much, new, often, only, our, over,
  place, please, same, sometimes, still, such, tell, thank, thing,
  think, under, us, very, where, why, yes.

### Token coverage (%)

| word set | OpenSubtitles | wordfreq |
|---|---:|---:|
| Ferriss written first-25 | 30.2 | 30.7 |
| Ferriss written-100 | 48.0 | 44.2 |
| Ferriss spoken-100 (101 words) | 43.4 | 38.7 |
| Ferriss union (143 words) | 52.8 | 47.4 |
| corpus's own top-25 | 34.9 | 31.1 |
| corpus's own top-100 | 58.2 | 46.0 |
| corpus's own top-300 | 71.9 | 56.7 |

So Ferriss's written-100 is within 2 points of an optimal modern 100 on
blended text (44.2 vs 46.0) and 10 points short on subtitles (48.0 vs
58.2), where the shortfall is mostly conversational words and clitics.
His "1/2" claim is correct for speech and about 4 to 6 points generous
for written web text.

## 3. Overlap between Ferriss's lists and the modern top-100

| comparison | Jaccard | shared |
|---|---:|---:|
| written-100 vs wordfreq top-100 | 0.667 | 80 |
| written-100 vs OpenSubtitles top-100 | 0.504 | 67 |
| spoken-100 vs wordfreq top-100 | 0.478 | 65 |
| spoken-100 vs OpenSubtitles top-100 | 0.406 | 58 |

**Written-100 vs wordfreq top-100.** Ferriss words not in the modern
top-100 (20): call, come, day, did, down, each, find, long, look, made,
many, may, number, oil, part, use, water, way, word, write. Modern words
missing from Ferriss (20): me, just, it's, new, don't, also, i'm, our,
good, only, after, know, over, think, any, back, us, want, because,
well. The Ferriss outliers (oil, water, write, word, number, call) are
tells of its origin as a children's reading list; `oil` is rank 834 on
wordfreq and 1571 on OpenSubtitles.

**Written-100 vs OpenSubtitles top-100.** Ferriss words missing (33):
by, call, could, day, down, each, find, first, has, into, its, long,
made, make, many, may, more, number, oil, other, part, people, said,
than, their, these, two, use, water, way, which, word, write. Modern
words missing from Ferriss (33): 's, 't, me, 'm, don, 're, know, just,
here, 'll, right, oh, well, yeah, 've, got, want, think, good, why, let,
yes, going, okay, back, us, where, take, our, gonna, tell, really, man.

Ferriss union words outside the wordfreq top-300 (13): almost (395),
either (464), friend (420), goodbye (4305), happy (443), hello (1944),
often (379), oil (834), sometimes (533), thank (317), word (555), write
(1008), yes (301). Outside the OpenSubtitles top-300 (16): almost, also,
each, either, goodbye, its, number, often, oil, part, sometimes, under,
use, water, word, write. No union word is absent from either corpus.

Full detail: `data/ferriss-lists.json`.

## 4. Top-300 per language with grammar flags

Files: `data/top300-<lang>.csv` for en, es, fr, de, it, pt, ja, zh.
Columns: rank, word, share_pct (wordfreq), cumulative_pct, kind
(grammar | content | number), opensubs_rank (rank of the same string in
OpenSubtitles 2018, blank if absent).

The `kind` flag is a **heuristic hand list** (`grammar_lists.py`):
articles, pronouns, be/have/do-type auxiliaries, prepositions and their
fused forms, conjunctions, negation particles, and (ja/zh) case, aspect,
and classifier particles. Modals, quantifiers, and adverbs are left as
"content" because they are swappable (very, always, can, all).

| lang | grammar words in top-300 | content words | numerals | grammar share of top-300 token mass (%) | content share (%) |
|---|---:|---:|---:|---:|---:|
| en | 98 | 195 | 7 | 74.3 | 24.9 |
| es | 103 | 189 | 8 | 80.9 | 18.5 |
| fr | 118 | 176 | 6 | 82.9 | 16.5 |
| de | 123 | 169 | 8 | 76.9 | 22.0 |
| it | 121 | 172 | 7 | 79.3 | 20.0 |
| pt | 97 | 196 | 7 | 77.0 | 22.4 |
| ja | 85 | 205 | 10 | 78.1 | 19.9 |
| zh | 76 | 215 | 9 | 56.7 | 41.7 |

Roughly a third of the top-300 by count, but three quarters by token
mass, is grammar. In English the content words are concentrated lower
down: ranks 1-100 hold 34 content words, 101-200 hold 72, 201-300 hold
89. First English content words in rank order: all, one, can, will,
just, like, more, no, there, time, get, would, new, people, some, also,
now, other, good, only, first, know, see, two, make, think, any, then,
could, back, want, go, well, said, way, most, much, very, even, should.

## 5. Exposure test on real English web prose

Corpus: 20 English Wikipedia articles (action API, `prop=extracts&
explaintext`; Photosynthesis, French Revolution, Jazz, Basketball, Mount
Everest, Bitcoin, Shakespeare, Coffee, Climate change, Python, Elephant,
Roman Empire, Chess, Volcano, Internet, Sushi, Antarctica, Beethoven,
Democracy, Bicycle) plus 7 ordinary pages fetched with curl: Paul
Graham's "How to Do Great Work", Ferriss's own language post, one CNN
lite article, and four NPR text-only articles. 219,996 running words in
total (wordfreq tokenizer, digits dropped). Wikipedia dominates the
pooled numbers (191,236 words); the web pages are reported separately.

Grammar sets: **narrow** = exactly the brief's list (articles, forms of
be/have/do, pronouns, of/to/in/that, and their contractions). **broad**
= narrow + prepositions, conjunctions, "not", wh-words, clitics.

### Tokens per 100 running words, all 27 documents pooled

| word set | all tokens in set | minus narrow grammar | minus broad grammar |
|---|---:|---:|---:|
| Ferriss union (143 words) | 42.3 | 16.5 | 5.7 |
| wordfreq en top-100 | 40.2 | 14.3 | 3.8 |
| wordfreq en top-300 | 47.9 | 21.6 | 10.1 |

### By text type (per 100 words)

| group | docs | words | Ferriss | Ferriss - narrow | Ferriss - broad | wf100 | wf100 - narrow | wf100 - broad | wf300 | wf300 - narrow | wf300 - broad |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Wikipedia | 20 | 191,236 | 41.2 | 15.9 | 5.1 | 39.1 | 13.8 | 3.3 | 46.1 | 20.5 | 9.1 |
| news/blog (p-tags) | 6 | 17,003 | 47.9 | 20.1 | 9.0 | 45.6 | 17.2 | 6.3 | 55.7 | 26.5 | 14.8 |
| Paul Graham essay (body text) | 1 | 11,757 | 53.3 | 22.4 | 10.7 | 51.8 | 19.5 | 8.2 | 67.1 | 32.3 | 20.0 |

Per-document spread (Ferriss union, all tokens): min 38.4, median 42.2,
max 53.3. Ferriss union minus broad grammar: min 3.7, median 5.4, max
10.7. wordfreq top-300 minus broad grammar: min 7.3, median 9.5, max
20.0. Full per-document table: `data/exposure-per-doc.csv` and
`data/out-exposure.md`.

Distinct words actually hit in the corpus: Ferriss union 142 of 143;
Ferriss minus broad grammar 73; wordfreq top-300 minus broad grammar
195.

Interpretation: a 1,000-word Wikipedia-style page offers about 50
swap opportunities from the Ferriss list once grammar words are
excluded, and about 90 from a 300-word frequency list. Conversational
prose (essays, news) offers roughly double. The remaining 35 to 40
tokens per 100 are articles, pronouns, prepositions, and auxiliaries,
which cannot be swapped word-for-word without breaking the sentence.

## 6. Cross-language consistency of top-100 lists

For each target language, the wordfreq top-100 was glossed by the model
with a single English word where one exists (`translations.py`,
**model-judged**, no dictionary). Fused forms (del, du, im), reflexive
clitics (se, sich), particles (の, 的, 了), inflection fragments, proper
nouns, and numerals were marked as having no one-word equivalent.

| lang | numerals / proper nouns | no one-word gloss | has gloss | gloss in en wf top-100 | gloss in en wf top-300 | gloss in en OpenSubs top-300 |
|---|---:|---:|---:|---:|---:|---:|
| es | 2 | 4 | 94 | 70 | 92 | 85 |
| fr | 3 | 6 | 91 | 79 | 90 | 88 |
| de | 3 | 9 | 88 | 70 | 85 | 82 |
| it | 0 | 17 | 83 | 69 | 83 | 80 |
| pt | 2 | 12 | 86 | 65 | 85 | 81 |
| ja | 6 | 42 | 52 | 42 | 49 | 45 |
| zh | 4 | 17 | 79 | 56 | 74 | 68 |

Where the gloss exists it almost always lands in the English top-300:
the glossed-but-outside cases are a handful per language (es: ni=nor,
va=goes; de: ja=yes, gibt=gives, geht=goes; zh: 月=month, 国家=country,
自己=self, 问题=problem, 发展=development; ja: なる=become, 月=month,
自己=self). Disagreement comes almost entirely from words with no
one-word English counterpart:

* Italian loses 17 of 100 to fused article+preposition forms (del,
  della, nel, alla, dei, sul...). Portuguese loses 12 (do, da, no, na,
  pelo...). Spanish and French lose fewer because wordfreq splits
  French elisions (l, d, qu) and Spanish fuses only al/del.
* German loses 9 to im/am/zum/zur/vom, sich, and the modal particles
  mal, doch, um.
* Chinese loses 17 to aspect and structural particles (的, 了, 着, 过,
  得, 地, 把, 吗, 个).
* Japanese loses 42: the MeCab top-100 is roughly half particles and
  inflection endings. Only 52 words have any English gloss at all.

Full table with the chosen gloss for every word: `data/crosslang-top100.csv`.

## Reproduce

```bash
# one-shot (downloads into DL, creates the venv, runs all five scripts)
bash /home/matt/Personal/projects/language-weave/research/run_all.sh \
  /tmp/claude-1001/-home-matt-Personal-projects-language-weave/e608e518-59cb-484f-8458-a134dcdfc280/scratchpad/data \
  /tmp/claude-1001/-home-matt-Personal-projects-language-weave/e608e518-59cb-484f-8458-a134dcdfc280/scratchpad/venv
```

Or step by step (DL = the download dir above, PY = `<venv>/bin/python -I`,
R = this directory):

```bash
python3 -m venv "$VENV" && "$VENV/bin/pip" install "wordfreq[cjk]"      # wordfreq 3.1.1
for l in en es fr de it pt zh_cn ja; do
  curl -sSL -o "$DL/freq/${l}_full.txt" \
    "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/$l/${l}_full.txt"
done
$PY $R/coverage_tables.py --freq-dir $DL/freq --out-dir $R/data        # section 1
$PY $R/ferriss_lists.py   --freq-dir $DL/freq --out-dir $R/data        # sections 2, 3
$PY $R/top300.py          --freq-dir $DL/freq --out-dir $R/data        # section 4
$PY $R/exposure.py --wiki-dir $DL/web/wiki --pages-dir $DL/web/pages --out-dir $R/data   # section 5
$PY $R/crosslang.py       --freq-dir $DL/freq --out-dir $R/data        # section 6
```

The Wikipedia and page URLs are listed in `run_all.sh`. The NPR and CNN
article ids are front-page items from 2026-10-15 and will go stale;
substitute any current ones.

Files produced:

* `data/coverage-opensubs.csv`, `data/coverage-wordfreq.csv`
* `data/ferriss-lists.json`
* `data/top300-{en,es,fr,de,it,pt,ja,zh}.csv`
* `data/exposure-per-doc.csv`
* `data/crosslang-top100.csv`
* `data/out-*.md` (raw script output used to build this report)

## Caveats

1. wordfreq frequencies are smoothed, log-binned, and blended; cumulative
   sums are coverage relative to its normalisation (top-50k mass 0.92 to
   1.00). German is the most undercounted (0.921).
2. OpenSubtitles is speech-like and clitic-split for English. Its
   top-100 contains `'s`, `'t`, `'m`, `'re`, `'ll`, `'ve`, which are not
   words a user would swap.
3. The OpenSubtitles Japanese file has had particles removed at source,
   has verb stems only, and is 200 times smaller than the English file.
   Treat its column as unusable. The wordfreq Japanese list is
   morpheme-level, so "top-N words" means "top-N morphemes".
4. Chinese coverage depends on the segmenter; the two sources segment
   differently and wordfreq's is the one the extension would likely use.
   The OpenSubtitles zh_cn file had 8.4% English tokens removed.
5. The wordfreq Portuguese list contains `the` at rank 92 (web-crawl
   contamination); it was excluded from the cross-language count.
6. Grammar/content flags and the cross-language glosses are model-judged
   hand lists. A different gloss choice for polysemous words (hace,
   fait, um, mal) could move a few words in or out of the top-300 check.
7. The exposure corpus is 87% Wikipedia by token count. The seven
   news/blog pages show 5 to 10 points more top-list coverage, so
   the pooled figure is a conservative floor for typical reading.
8. The brief's spoken list has 99 entries, so "spoken-100" is 99
   entries / 101 expanded words.
9. All counts are by surface form. `make`/`made`, `go`/`goes`, and
   `is`/`was` are separate words everywhere in this report.

## What this means for word selection

1. Frequency alone will not pick swap words: ~75% of top-300 token mass is unswappable grammar in every language.
2. Build the list content-first. Only 34 of the English top-100 are content words; 89 of ranks 201-300 are.
3. A ~75-word content list (Ferriss union minus grammar) gives ~5 swaps per 100 words on Wikipedia, ~9 on essays.
4. A 300-word list roughly doubles that (10 per 100 pooled, 15-20 on essays). Plan for one swap per sentence or two.
5. Use wordfreq (blended written text) for the English side, not subtitles; subtitles over-weight yeah/gonna/okay/oh.
6. Ferriss's written-100 is 80% identical to the modern top-100 and is a fine seed.
7. Drop its primer leftovers (oil, water, write, word, number, call); add just, new, also, only, after, over, think, know, want, because, well, good.
8. For es/fr/de/it/pt, English-driven and target-driven lists agree on 83-92 of the target top-100.
9. Their disagreements are fused function words (del, du, im, nel) the extension should never swap anyway.
10. For ja and zh, pick from the target side by content category; half the Japanese top-100 morphemes are not words.
11. Adverbs, quantifiers, and modals (very, always, all, can, more, only) are the richest safe swap class in all seven targets.
12. Expect encyclopedic pages to be the floor; news and essays give 5-10 more hits per 100 words.
