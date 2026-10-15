# Experiment: can a deterministic swapper reach high sense-and-form precision?

Date: 2026-10-15. Machine: code-01 (4 cores, no GPU). Scripts: `research/experiment/`;
exact commands: `research/experiment/RUN.md`; every table: `research/experiment/tables.md`;
every judgment: `research/experiment/judged/<lang>.jsonl`.

**Short answer.** Not at the volume asked for. On real English web prose a lexicon +
spaCy + rules core with every rule on reaches 70% correct at F1 (POS match), 82% at F2
(dominant-sense entries only) and 86.5% at F3 (plus Marian NMT agreement), judged by
Sonnet, at 9.1 / 6.1-6.5 / 5.5 swaps per 100 words. The conservative configuration
(connectors, adverbs, article+noun, article+adjective+noun; German NOM/ACC only) reaches
89.8% / 92.3% at F2 (Sonnet / Opus) and 93.7% / 96.9% [94-98] at F3 (n=255), but at 2.0-2.6
(F2) and 1.6-2.2 (F3) swaps per 100 words, below the ~3 target. The dominant error is wrong
sense (idioms, phrasal verbs, context-specific senses), not gender, case or conjugation,
which together stay at ~3 points at every level. Case and conjugation mostly cost
*recall*: the rules cover 17% of verb occurrences, and German case is assignable for 77%
of article+noun slots.

## Method

Question: can a deterministic swapper (lexicon + POS tagger + rules, no cloud LLM)
reach high sense-and-form precision on real English web prose, and what do German
case and verb conjugation cost it? Every number below is produced by the scripts in
`research/experiment/` (commands in `research/experiment/RUN.md`).

Corpus: the 27 English documents downloaded for the coverage report (20 Wikipedia
extracts, 7 news/blog pages), parsed paragraph by paragraph with spaCy
`en_core_web_md` 3.8.0. Sentences with fewer than 4 or more than 120 tokens, or without
a lowercase letter, were dropped.

Lexicon (`build_lexicon.py`): wordfreq English top-1,500 surface forms, lemmatized with
spaCy's corpus-observed majority lemma (WordNet morphy as fallback). Grammar words from
`grammar_lists.py`, modals/auxiliaries, interjections, numerals, month/day names,
nationality adjectives, quantifier determiners (all/some/many/each...), and proper nouns
were dropped. Allowed POS per lemma = content POS (NOUN/VERB/ADJ/ADV) observed in the
corpus with at least 3 occurrences and a 10% share; lemmas with under 3 occurrences fall
back to WordNet POS. The first 500 content lemmas by wordfreq rank were kept, plus 24
connectors (because/but/also/although/however/...) and 27 fixed phrases.

Packs (`gen_packs.py`, prompt `prompts/pack_gen.txt`): `claude -p --model sonnet`, 50
entries per call, one call set per language. Each entry carries the translation of
the dominant sense, noun gender and plural (German: genitive singular and dative
plural), adjective forms (German: predicative base + attributive stem), the infinitive
and six present-indicative forms, a `dominant_sense_covers_90pct` boolean, and an
ambiguity note. Replies were validated for shape; malformed objects were re-requested.

Swapper (`swapper.py`): rules as specified in the brief (ADV/CONN token swap; N-bare;
N-det with article by gender/number and, for German, case from the dependency role and
a preposition table; N-adj with agreement and word order; ADJ-pred with it/this/that or a
pack-noun subject; V-inf after "to" or a modal; V-pres with an explicit pronoun subject
within two tokens; exact-match phrases). Never inside proper nouns, named entities,
numbers, URLs, code-like tokens, hyphenated compounds, title-case runs, capitalized
mid-sentence tokens, or quotation marks (paragraph-level, an unpaired opening quote runs
to the paragraph end). Every skipped opportunity is counted by reason.

Filters: F0 = naive lemma match ignoring POS (F1 candidates plus the extra "F0-only"
tokens whose spaCy POS does not match any pack POS, swapped with the pack's most frequent
POS entry). F1 = POS match (all rule candidates). F2 = F1 and
`dominant_sense_covers_90pct` (variants: WordNet synset count <= 3, <= 5). F3 = F2 and NMT
verification: the sentence is translated with Helsinki-NLP opus-mt en-xx (Marian, CPU,
beam 2) and the swap is kept only if an inflected pack form of every swapped target word
appears as a whole token (lowercase, accent-insensitive) in the output. A German
"relaxed" variant also accepts the form as the tail of a compound.

Judging (`sample.py`, `judge.py`, prompt `prompts/judge.txt`): stratified sample per
language from the F1 set (nouns split N-bare/N-det plus all N-adj, predicative adjectives,
adverbs/connectors, V-inf/V-pres verbs, phrases) plus 40 F0-only items judged separately
so F0 precision can be computed as a population-weighted mix. `claude -p --model sonnet`,
20 items per call, sees the original sentence, the swapped sentence as a reader would see
it, the swap and the pack gloss, and returns one of eight labels plus a reason.
Reliability: 100 Spanish items re-judged with `--model opus`. Precision at F2/F3 is the
correct rate among judged items that carry that flag; the all-class F1 figure is
population-weighted by the number of candidates per rule.

Tagger comparison (`tag_compromise.js`, `tagger_compare.py`): compromise 14 tags every
sentence; for each judged item the term covering the head token is mapped to a coarse
POS and compared with spaCy and with the POS the rule requires.

Two protocol notes. (1) The first French/German judging pass penalized English
prepositions left outside the swapped span ("in le système naturel"), which is inherent
to a diglot weave; the prompt was tightened to judge the span only and fr/de were
re-judged from scratch (archived replies in the scratchpad). (2) The full-corpus NMT pass
ran at 2-4 sentences/s on this CPU, so F3 was computed on every judged item's sentence
plus a seeded random subset of 2,500 sentences per language (word-scaled) for the recall
estimate; the cache is resumable and `--full` completes the corpus.

Follow-up additions (coordinator): every judged F2 item in the "conservative"
configuration (CONN, ADV, N-det, N-adj; German NOM/ACC only; 323 items) was re-judged
in full with Opus; a per-lemma precision table (`per-lemma.csv`) and a 112-entry
multiword-expression blocklist analysis (`mwe_blocklist.txt`) were added.

## Pack sizes after each filter

| lang | entries (F1) | by POS | dominant-sense (F2) | WordNet syn<=3 | syn<=5 | entries with >=1 F3-retained candidate (subset) |
|---|---|---|---|---|---|---|
| es | 696 | NOUN 305, VERB 157, ADJ 125, ADV 58, CONJ 24, PHRASE 27 | 460 | 219 | 367 | 349 |
| fr | 696 | same | 464 | 219 | 367 | 372 |
| de | 696 | same | 447 | 219 | 367 | 317 |

Lexicon: 500 content lemmas (wordfreq ranks 10-875 after dropping grammar/aux/determiner
words) = 645 lemma+POS entries, plus 24 connectors and 27 phrases.

## Precision (judged samples, Sonnet)

"Correct" rate with 95% Wilson interval; n = judged items carrying that filter flag.
F0 is a population-weighted mix of the F1 sample and 40 separately judged F0-only items
(POS mismatch); judged items with NMT output available: es 400/400; fr 400/400; de 400/400. F0-only items were 2.5-7.5% correct, so F0 is only marginally below F1
because POS-mismatch tokens are few (0.45 per 100 words). Full per-language tables with
the syn<=3 / syn<=5 variants are in `tables.md`.

### All languages pooled (1,200 F1 items + 120 F0-only)

| class / rule | n | F0 | F1 | F2 | F3 |
|---|---|---|---|---|---|
| NOUN N-bare | 150 | 58.6% | 59.3% [51-67] | 67.0% [57-75] n=100 | 70.8% [61-79] n=89 |
| NOUN N-det | 150 | =F1 | 74.0% [66-80] | 88.9% [81-94] n=90 | 93.7% [86-97] n=79 |
| NOUN N-adj | 60 | =F1 | 66.7% [54-77] | 95.0% [76-99] n=20 | 100.0% [81-100] n=16 |
| ADJ ADJ-pred | 180 | 21.1% | 68.3% [61-75] | 80.2% [72-86] n=116 | 87.4% [79-93] n=95 |
| ADV | 150 | 70.9% | 77.3% [70-83] | 85.8% [78-91] n=113 | 90.6% [83-95] n=85 |
| CONN | 150 | 82.0% | 82.7% [76-88] | 93.8% [88-97] n=112 | 95.3% [89-98] n=85 |
| VERB V-inf | 150 | 58.6% | 62.7% [55-70] | 77.8% [68-85] n=90 | 81.0% [70-89] n=63 |
| VERB V-pres | 150 | =F1 | 72.0% [64-79] | 81.4% [73-88] n=97 | 85.7% [76-92] n=77 |
| PHRASE | 60 | =F1 | 60.0% [47-71] | 65.9% [51-78] n=41 | 79.2% [60-91] n=24 |
| ALL (sample mean) | 1200 | 63.2% | 70.1% [67-73] | 81.8% [79-84] n=779 | 86.5% [84-89] n=613 |
| ALL (population-weighted by rule volume) | | | 65.7% | | |

### Per language (ALL row, sample mean)

| lang | F1 | F2 | F3 | wrong_sense share of F1 errors |
|---|---|---|---|---|
| es | 66.2% [61-71] | 79.9% [75-84] n=264 | 84.5% [79-89] n=213 | 23.2 of 33.8 points |
| fr | 67.8% [63-72] | 82.5% [77-87] n=263 | 87.6% [82-91] n=209 | 26.0 of 32.2 points |
| de | 76.2% [72-80] | 82.9% [78-87] n=252 | 87.4% [82-91] n=191 | 17.2 of 23.8 points |

Per-language class highlights: German N-det 86.0% F1 / 96.7% F2 (n=50/30) and N-adj
95.0% / 100% (n=20/6); French N-det 70.0% / 90.0%, V-pres 82.0% / 91.9%; Spanish
N-det 66.0% / 80.0%, ADJ-pred 63.3% / 78.4%; phrases 40-80% in every language
("a lot of" -> "mucho of", "as well as" -> "también as").

### Error types (pooled, share of judged items at each level)

| level | n | correct | wrong_sense | wrong_gender | wrong_number | wrong_case | wrong_conjugation | wrong_order_or_awkward | should_not_swap_other |
|---|---|---|---|---|---|---|---|---|---|
| F1 | 1200 | 70.1% | 22.2% | 0.2% | 1.2% | 0.4% | 1.2% | 4.2% | 0.5% |
| F2 | 779 | 81.8% | 10.1% | 0.4% | 1.0% | 0.5% | 1.3% | 4.2% | 0.6% |
| F3 | 613 | 86.5% | 6.4% | 0.5% | 1.0% | 0.7% | 1.0% | 3.3% | 0.8% |
| F0-only | 120 | 4.2% | 76.7% | 0.0% | 1.7% | 0.0% | 4.2% | 6.7% | 6.7% |

Form errors (gender + number + case + conjugation) are 3.0 points at F1 and 3.2 at F2;
sense errors are 22.2 and 10.1. F2 halves the sense errors and leaves the form errors.

## Retained opportunities per 100 words (recall side)

Nouns are counted once per token (best rule: N-adj > N-det > N-bare). "Conservative"
drops N-bare (bare noun under an English article) and phrases.

| lang | set | F0 | F1 | F2 | F3 |
|---|---|---|---|---|---|
| es | all rules | 9.55 | 9.11 | 6.45 | 5.51 |
| es | conservative | | 3.48 | 2.58 | 2.15 |
| fr | all rules | 9.55 | 9.11 | 6.09 | 5.01 |
| fr | conservative | | 3.48 | 2.38 | 1.79 |
| de | all rules | 9.55 | 9.11 | 5.88 | 4.43 |
| de | conservative | | 2.87 | 1.99 | 1.56 |

By rule at F1 / F2 (es; fr and de differ only where noted): N-bare 5.80 / 3.92;
N-det 1.10 / 0.70 (de 0.84 / 0.52 because of case); N-adj 0.17 / 0.08 (de 0.10 / 0.03);
ADJ-pred 0.08 / 0.05; ADV 1.16 / 0.87; CONN 1.05 / 0.94; V-inf 0.53 / 0.31;
V-pres 0.14 / 0.08; PHRASE 0.36 / 0.30. F3 by rule: see `tables.md`.

Largest skipped-opportunity reasons (per 100 words): pack noun without a simple
the/a/an determiner 3.21; verb participle 1.05; past 0.81; gerund 0.67; noun used as
compound modifier 0.50; comparative adjective 0.45; NP with another modifier 0.38;
other determiner 0.37; present tense with a noun subject 0.36; adjective not in pack 0.31;
inside quotation 0.27 (nouns alone); hyphenated 0.21.

## German case exposure

Share of German article+noun candidates (N-det/N-adj path, 3,954) by assigned case, and
precision of the judged N-det/N-adj items in each:

| case | n | share | judged | correct | wrong_case | wrong_gender | other |
|---|---|---|---|---|---|---|---|
| NOM (subject, predicate nominative) | 1156 | 29.2% | 31 | 93.5% | 0% | 0% | 6.5% |
| ACC (direct object; für/durch/ohne/gegen/über/into) | 951 | 24.1% | 22 | 90.9% | 0% | 0% | 9.1% |
| DAT (mit/von/zu/nach/vor/bei/an/seit/by/between) | 554 | 14.0% | 10 | 70.0% | 20% | 0% | 10% |
| GEN (of, during) | 388 | 9.8% | 7 | 85.7% | 0% | 0% | 14.3% |
| ambiguous (two-way in/on/over/under/behind) | 532 | 13.5% | skipped | | | | |
| unsupported (unmapped preposition, apposition, adverbial NP, root, ...) | 373 | 9.4% | skipped | | | | |

Case is assignable for 77% of article+noun slots; the rule assigns it correctly in all
judged NOM/ACC/GEN items and in 8 of 10 DAT items (the two misses: "led to der
Entwicklung" judged as needing "zur", and a dative after "to" that a translation would
render with a different preposition). Wrong gender never appeared: the pack's gender
field is reliable. The cost of case is recall: N-det drops from 1.10 to 0.84 per 100
words (-24%) and N-adj from 0.17 to 0.10 (attributive endings implemented only for
NOM/ACC). German N-bare, which carries no case, is the weakest German rule (58% F1).

## Conjugation exposure

8,927 pack-verb occurrences in the corpus (the English side is identical for all three
languages):

| form | share | rule |
|---|---|---|
| past participle (VBN) | 26.2% | skipped |
| simple past (VBD) | 20.2% | skipped |
| gerund/-ing (VBG) | 16.6% | skipped |
| present with a noun subject | 9.0% | skipped |
| bare form after "to" | 8.2% | V-inf |
| bare form after a modal | 5.1% | V-inf |
| bare form, other (imperative, "help/make/let X do") | 3.0% | skipped |
| present with a relative/other pronoun subject | 2.5% | skipped |
| phrasal verb (particle child) | 2.3% | skipped |
| present without an nsubj | 1.5% | skipped |
| do-support (negation/question/emphasis) | 1.4% | skipped |
| present with I/you/he/she/it/we/they within 2 tokens | 3.4% | V-pres |
| other (questions, far pronoun, aux) | 0.6% | skipped |

V-inf + V-pres cover 16.7% of verb occurrences (1,488). Within that covered slice,
conjugation itself is rarely wrong (1.2-1.3% of all judged items at F1/F2; 7 of 150
V-pres items pooled), and the misses are subjunctive contexts ("make sure you use" ->
"usas"), generic "you", and "like"/"love" needing gustar/encantar. Verb sense is the
problem: V-inf is 62.7% / 77.8% correct (keep quiet, take time, turn despotic, send
someone down a face), V-pres 72.0% / 81.4%.

## Adjective-agreement exposure

| | es | fr | de |
|---|---|---|---|
| pack-noun opportunities | 13,987 | 13,987 | 13,987 |
| with at least one adjective | 4,510 (32.2%) | same | same |
| exactly det + pack adjective + noun | 372 | 372 | 290 |
| N-adj candidates | 372 | 372 | 219 (NOM/ACC only) |
| predicative pack adjectives seen | 455 | 455 | 455 |
| ADJ-pred candidates (gendered-subject rule) | 168 | 168 | 168 |
| attributive pack adjectives left alone | 4,524 | 4,524 | 4,524 |

A third of noun slots carry an adjective, and the pack covers the adjective in only 8% of
those. N-adj is precise when it fires (95% at F2 pooled, n=20) but rare (0.17 per 100
words). Agreement errors are nearly absent inside N-adj; the ADJ-pred misses are number
agreement when the pronoun subject rule picks the wrong antecedent ("tablebases that
became disponible" -> needs "disponibles") and gender when the English subject noun's
Spanish gender differs ("28 meters largo" with "cancha" feminine). Predicative German
adjectives are uninflected, so German ADJ-pred is 76.7% / 85.4% versus 63-65% / 76-78% in
es/fr with the same rule.

## Judge reliability (Spanish, Sonnet vs Opus, 100 items)

Exact label agreement 80%, correct-vs-not agreement 80%, Cohen's kappa 0.53. Sonnet
called 63% of the 100 items correct, Opus 77%. On the same 100 items: F1 (n=100) Sonnet 63% / Opus 77%; F2 (n=59) Sonnet 78% / Opus 93%; F3 (n=53) Sonnet 81% / Opus 98%.

Direction: of the 20 disagreements, 16 are Sonnet-wrong / Opus-correct, mostly nouns:
"el gran trabajo", "el final (of the century)", "el campo (of study)", "título
(championship)", "part -> parte", "world -> mundo" (Sonnet objected to the English article
left outside the span on N-bare items; 3-4 of 50 N-bare labels per language are of this
kind). The 4 opposite cases are Opus being stricter on sense ("a game" of chess ->
"partida", "the language" Python -> "lenguaje"). Sonnet's figures are therefore a
strict lower bound; Opus would put F1/F2 roughly 10 points higher on nouns and 5 points
higher overall, which does not change the decision. Of the 83 F3 items Sonnet labelled not-correct, 16 carry a reason that itself calls the swap acceptable (self-contradicting labels); counting them as correct would move pooled F3 from 86.5% to 89.1%. The failure examples
below exclude such items.

## Tagger comparison (compromise 14 vs spaCy en_core_web_md)

On 1,260 judged tokens compromise agrees with spaCy on the coarse POS 87.9% of the time
(es 87.9%, fr 87.9%, de 88.1%; the three samples share the same English tokens). Using
compromise's POS decision instead of spaCy's for F1 would drop 19-22 judged-correct and
11-15 judged-wrong items per 380 F1 items (retaining 92% of spaCy's F1 volume) and admit
8 of 40 F0-only items, 7-8 of which are judged wrong. Population-weighted, F1 precision
with compromise is 67.0% (es), 69.9% (fr), 76.2% (de) versus 66.6%, 69.2%, 76.1% with
spaCy: the tagger choice does not move precision; sense does. Main confusions:
subordinating conjunctions and "however/also/yet"-type adverbs tagged as plain
Conjunction/Adverb (harmless for CONN), and noun/verb flips on "work", "use", "play",
"match", "check".

Throughput on this VM, idle, same 11,363 sentences / 222,014 words: spaCy
en_core_web_md 4,475 words/s (single process, tagger+parser+NER); compromise 15,942
words/s (single thread). Under load (NMT + judging running) they fell to 3,337 and
4,696 words/s.

## Conservative configuration: CONN + ADV + N-det + N-adj, German NOM/ACC only

This is the configuration that would ship if the deterministic core shipped at all: no
bare nouns, no verbs, no predicative adjectives, no phrases. Every judged F2 item in it
(323 across the three languages) was re-judged with Opus.

| lang | judge | F1 | F2 | F3 |
|---|---|---|---|---|
| es | Sonnet | 71.2% [64-77] n=170 | 88.7% [82-93] n=115 | 92.6% [85-96] n=94 |
| es | Opus | - | 93.0% [87-96] n=115 | 97.9% [93-99] n=94 |
| fr | Sonnet | 72.9% [66-79] n=170 | 89.8% [83-94] n=108 | 95.2% [88-98] n=83 |
| fr | Opus | - | 90.7% [84-95] n=108 | 95.2% [88-98] n=83 |
| de | Sonnet | 86.9% [81-91] n=153 | 91.0% [84-95] n=100 | 93.6% [86-97] n=78 |
| de | Opus | - | 93.0% [86-97] n=100 | 97.4% [91-99] n=78 |
| pooled | Sonnet | 76.7% [73-80] n=493 | 89.8% [86-93] n=323 | 93.7% [90-96] n=255 |
| pooled | Opus | - | 92.3% [89-95] n=323 | 96.9% [94-98] n=255 |

By rule, pooled, at F2 (Sonnet / Opus): CONN 93.8% / 94.6% (n=112); ADV 85.8% / 90.3%
(n=113); N-det 88.5% / 91.0% (n=78); N-adj 95.0% / 95.0% (n=20). F3 by rule:
CONN-tok 95.3% [89-98] / 96.5% [90-99] (n=85); ADV-tok 90.6% [83-95] / 96.5% [90-99] (n=85); N-det 94.2% [86-98] / 97.1% [90-99] (n=69); N-adj 100.0% [81-100] / 100.0% [81-100] (n=16)

The two judges agree on correct-vs-not for 94.4% of these 323 items. Opus's 25 errors are
19 wrong_sense, 5 wrong_order_or_awkward, 1 should_not_swap: "even" before a comparative
-> "incluso" (should be "aún"), "especially" intensifying an adjective -> "surtout",
"anyway" meaning nevertheless -> "de toute façon", "up until" -> "up bis", "no longer"
-> "nicht mehr"-type cases, "the state" needing "l'État". These are sense and
collocation errors on high-frequency adverbs and connectors, not form errors.

Retained opportunities per 100 words for this configuration (nouns once; F3 word-scaled on
the random subset):

| lang | F1 | F2 | F3 |
|---|---|---|---|
| es | 3.48 | 2.58 | 2.15 |
| fr | 3.48 | 2.38 | 1.79 |
| de | 2.87 | 1.99 | 1.56 |

At F2 the configuration sits at 90-92% correct with 2.0-2.6 swaps per 100 words; the
~3-per-100 target is met only at F1 (3.5 / 3.5 / 2.9), where precision is 71-87%.

## Per-lemma precision (worst lemmas)

172 lemmas have 3 or more judged F1 items pooled across languages; 38 of them are under
50% correct. Full table in `research/experiment/per-lemma.csv`. The worst, by rate then
volume:

| lemma | class | n | correct | dominant error |
|---|---|---|---|---|
| long | ADV | 8 | 0 | wrong_sense ("no longer", "too long") |
| as well | PHRASE | 8 | 0 | breaks "as well as" |
| shot | NOUN | 7 | 0 | wrong_sense (basketball shot) |
| keep | VERB | 7 | 0 | wrong_sense (keep quiet / keep up) |
| a lot | PHRASE | 6 | 0 | "a lot of" -> "mucho of" |
| party | NOUN | 5 | 0 | wrong_sense (expedition party) |
| present | ADJ | 5 | 0 | wrong_number / sense |
| process, issue, point | NOUN | 3-4 | 0 | wrong_sense |
| meet, turn, set | VERB | 3-4 | 0 | wrong_sense |
| major, fine | ADJ | 3 | 0 | wrong_sense (major key, fine = ok) |
| too | ADV | 3 | 0 | wrong_sense (too = excessively) |
| ago | ADV | 3 | 0 | word order (hace / il y a precede the span) |
| worth | ADJ | 9 | 1 | wrong_sense ("worth it") |
| term, likely, take, yet, work, come | mixed | 5-7 | 1 | wrong_sense |

Pattern: the pack's dominant-sense flag (F2) already removes most of these (the F2 n/correct
column in `tables.md` is 0/0 for shot, keep, party, process, issue, point, meet, turn, set,
fine, too, term, take, yet), so the per-lemma table mainly tells the F1 story. The lemmas
that survive F2 and still fail are "long", "as well", "a lot", "likely" (7 F2 items, 1
correct: "likely" as adjective -> "probable/wahrscheinlich" reads wrong in "is likely to"),
"worth", "work" (NOUN), "come", "ago", "major".

## Idiom / multiword-expression exposure

A 112-entry MWE blocklist (`mwe_blocklist.txt`: in order to, as part of, give rise to,
take place, at least, in fact, as well as, no longer, in the face of, on the model of, ...)
applied to the judged non-phrase F2 items:

| lang | F2 judged | F2 wrong | wrong inside an MWE | of which wrong_sense | correct inside an MWE | F2 precision before -> after |
|---|---|---|---|---|---|---|
| es | 248 | 47 | 11 | 10 | 4 | 81.0% -> 84.5% |
| fr | 250 | 41 | 6 | 6 | 6 | 83.6% -> 85.3% |
| de | 240 | 40 | 3 | 3 | 1 | 83.3% -> 84.3% |
| pooled | 738 | 128 | 20 | 19 | 11 | 82.7% -> 84.7% |

The blocklist removes 20 of 128 F2 errors (16%) and 11 correct swaps; most-hit entries:
no longer (3), in the face of, as part of, on the model of, in other words, give rise to (2
each). In the corpus it would block 1.8-2.6% of F2 candidates (0.12-0.18 per 100 words). The
remaining 108 F2 errors are not list-able idioms: they are context senses (court = sports
court vs Gericht, party = expedition, check = chess check, range = geographic range, review
= literature review, title = championship) and collocations ("play a large role", "turn
despotic", "send one down the face").

## Failure examples

1. [de ADJ-pred F2=y F3=y] "A successful shot is wert two points, or three points if it is taken from beyond the three-point arc 6.75 meters (22 ft 2 in) from the basket in international games and 23 feet 9 inches (7.24 m) in NBA games." — swap: worth -> wert — **wrong_order_or_awkward**: German puts 'wert' after the amount ('zwei Punkte wert'). Here the amount follows it.
2. [de ADJ-pred F2=y F3=y] "I bit the bullet and learned all 1945 of the Joyo Kanji and then some when I was studying for 1kyu, and it was absolutely wert it." — swap: worth -> wert — **wrong_sense**: 'worth it' is 'es wert' / 'lohnend'; bare 'wert it' is not natural and the idiom differs.
3. [de ADV-tok F2=y F3=y] "As Sharp's condition deteriorates and other descending climbers pass him, his opportunities for rescue diminish: his legs and feet curl from frostbite, preventing him walking; später descending climbers are lower on oxyg" — swap: later -> später — **wrong_sense**: 'later' is an adjective modifying 'climbers', so German needs 'spätere', not the adverb 'später'.
4. [de N-bare F2=y F3=y] "The length of this varies between males of different Alter and conditions, lasting from days to months." — swap: ages -> Alter — **wrong_number**: 'ages' plural; 'Alter' as plural of 'different ages' would be 'Altersstufen'; 'Alter' is singular, mismatch with 'different'.
5. [de N-bare F2=y F3=y] "Rich families from Rome usually had two or more houses: a townhouse (domus) and at least one luxury home (villa) outside the Stadt." — swap: city -> Stadt — **wrong_case**: 'outside the city' requires 'außerhalb der Stadt' (genitive), but bare 'Stadt' lacks the article 'der' inside the span.
6. [de N-bare F2=y F3=y] "Continuing my analysis of the lists recommended by Tim, I compared his 100 Most Common Spoken Words in English list with his 100 Most Common Written Words in English Liste, and this is what I found:" — swap: list -> Liste — **should_not_swap_other**: 'list' is the last word of a quoted list title, so it should stay English.
7. [de N-bare F2=y F3=y] "They replace deciduous milk teeth at 6–12 Monate of age and keep growing at about 17 cm (7 in) a year." — swap: months -> Monate — **wrong_case**: 'mit 6–12 Monaten' needs the dative plural Monaten.
8. [de V-pres F2=y F3=y] "But the faster you make them, the faster you lernst.  " — swap: learn -> lernst — **wrong_conjugation**: Subject 'you' in 'the faster you learn' would be 'lernst' (du) — correct form for du.
9. [es ADJ-pred F2=y F3=y] "I believe this is similar to what Tim explains in his Judo vocab example." — swap: similar -> similar — **should_not_swap_other**: Swap is identical to the English word; nothing visibly changed.
10. [es ADJ-pred F2=y F3=y] "that's as bueno a bet as you'll find." — swap: good -> bueno — **wrong_order_or_awkward**: "as good a bet as" is a fixed comparative construction ("tan buena apuesta como"); swapping "good" alone breaks it and gender would be feminine.
11. [es ADJ-pred F2=y F3=y] "Although there are some differences between oxygenic photosynthesis in plants, algae, and cyanobacteria, the overall process is quite similar in these organisms." — swap: similar -> similar — **should_not_swap_other**: Swap is identical to the English word; nothing visibly changed.
12. [es ADJ-pred F2=y F3=y] "A regulation basketball court in international games is 28 meters (92 feet) largo and 15 meters (49 feet) wide." — swap: long -> largo — **wrong_gender**: 'cancha' is feminine, so it needs 'larga'.
13. [es ADJ-pred F2=y F3=y] "Volcanoes that, though large, are not grande enough to be called supervolcanoes, may also form calderas (collapsed crater) in the same way." — swap: large -> grande — **wrong_number**: 'Volcanoes' is plural, so it needs 'grandes'.
14. [es ADV-tok F2=y F3=y] "Fossils from the Middle Paleolithic era, or Middle Stone Age, from 250,000 to around 30,000 years hace, commonly show signs of traumatic injury, but these wounds are mostly linked to probable accidents, perhaps due to hu" — swap: ago -> hace — **wrong_order_or_awkward**: 'hace' goes before the time expression ('hace 30.000 años'), so 'years hace' reverses the order.
15. [es N-bare F2=y F3=y] "Karpov defended his título twice against Viktor Korchnoi and dominated the 1970s and early 1980s with a string of tournament successes." — swap: title -> título — **wrong_sense**: 'title' here means championship, not a work's name; should be 'título' in the championship sense, but gloss is name of a work.

## Decision

1. No deterministic configuration clears ~97% correct while keeping >=3 opportunities per 100 words. The conservative configuration (CONN + ADV + N-det + N-adj, German NOM/ACC) is 89.8% (Sonnet) / 92.3% (Opus) correct at F2 with 2.6 / 2.4 / 2.0 swaps per 100 words (es/fr/de), and 93.7% [90-96] n=255 (Sonnet) / 96.9% [94-98] n=255 (Opus) at F3 with 2.15 / 1.79 / 1.56 per 100 words. Only the Opus-judged F3 figure touches 97%, and it does so at roughly half the volume target; the 3-per-100 mark is met only at F1 (3.5 / 3.5 / 2.9), where the same configuration is 71-87% correct.
2. The full rule set reaches 70% at F1 (9.1 per 100 words), 82% at F2 (5.9-6.5), 86.5% at F3 (5.51 es); the gap to 97% is wrong sense, not form: gender/number/case/conjugation together are ~3 points at every level.
3. In: connectors (94-95% at F2), N-det with article (89-91% pooled; German N-det 97% at F2 with case assigned from the dependency role), N-adj (95%, rare), adverbs only after a per-lemma blocklist (long/too/ago/yet/even/especially/anyway are the recurring errors).
4. Out: N-bare (59-67%, article-less and sense-prone), phrases as implemented (60-66%: "a lot of", "as well as" break), V-inf/V-pres as the sole verb path (63-78% and only 17% of verb occurrences), predicative adjectives (68-80%, agreement with the English subject fails).
5. German case costs recall, not precision: 77% of article+noun slots get a case (NOM 29%, ACC 24%, DAT 14%, GEN 10%), 23% are two-way-preposition or unsupported, and 0 of 60 judged NOM/ACC/GEN items were wrong_case (2 of 10 DAT were).
6. Conjugation costs recall: V-inf + V-pres cover 16.7% of pack-verb occurrences; 61% are past/participle/gerund that the rules never touch.
7. A deterministic core can ship only as a narrow, high-precision layer (connectors + article-bearing nouns, ~2 per 100 words at ~90-93%); the remaining budget to reach ~3-5 per 100 words at 97% needs a sense-aware selector (LLM or NMT-aligned) rather than more rules.
8. Cheap wins before that: drop the 38 sub-50% lemmas (per-lemma.csv), apply the MWE blocklist (+2 points at F2 for 1.8-2.6% recall), extend phrase matching to "a lot of"/"as well as", and keep the F2 dominant-sense flag (it halves sense errors while keeping 65-70% of volume).
