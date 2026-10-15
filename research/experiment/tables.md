Corpus: 27 docs, 222014 running words, 11363 sentences (spaCy en_core_web_md, 2209.2 words/s).

## Pack sizes

| lang | entries | by POS | dominant (F2) | syn<=3 | syn<=5 | entries with >=1 F3-retained candidate |
|---|---|---|---|---|---|---|
| es | 696 | {'ADJ': 125, 'ADV': 58, 'CONJ': 24, 'NOUN': 305, 'PHRASE': 27, 'VERB': 157} | 460 | 219 | 367 | 349 |
| fr | 696 | {'ADJ': 125, 'ADV': 58, 'CONJ': 24, 'NOUN': 305, 'PHRASE': 27, 'VERB': 157} | 464 | 219 | 367 | 372 |
| de | 696 | {'ADJ': 125, 'ADV': 58, 'CONJ': 24, 'NOUN': 305, 'PHRASE': 27, 'VERB': 157} | 447 | 219 | 367 | 317 |

## Retained candidates per 100 words (recall side)

### es

F3 and F1+NMT columns are estimated on a seeded random subset of 2500 sentences (48984 words; 1901/1901 F1 sentences translated); the F1/F2 columns are over the whole corpus. 'subset' rows show F1/F2 on the same subset for comparison.

| class / rule | F0 (naive) | F1 | F2 | F3 | F1+NMT | F2syn3 | F2syn5 | F1 subset | F2 subset |
|---|---|---|---|---|---|---|---|---|---|
| NOUN N-bare | 5.87 | 5.80 | 3.92 | 3.59 | 4.84 | 0.80 | 2.20 | 5.80 | 3.89 |
| NOUN N-det | 1.10 | 1.10 | 0.70 | 0.66 | 0.91 | 0.14 | 0.37 | 1.09 | 0.71 |
| NOUN N-adj | 0.17 | 0.17 | 0.08 | 0.08 | 0.13 | 0.00 | 0.03 | 0.19 | 0.10 |
| ADJ ADJ-pred | 0.25 | 0.08 | 0.05 | 0.04 | 0.06 | 0.02 | 0.04 | 0.08 | 0.05 |
| ADV ADV-tok | 1.30 | 1.16 | 0.87 | 0.54 | 0.61 | 0.66 | 0.91 | 1.11 | 0.85 |
| CONN CONN-tok | 1.06 | 1.05 | 0.94 | 0.88 | 0.91 | 0.97 | 1.04 | 1.08 | 0.96 |
| VERB V-inf | 0.58 | 0.53 | 0.31 | 0.22 | 0.31 | 0.03 | 0.11 | 0.54 | 0.33 |
| VERB V-pres | 0.14 | 0.14 | 0.08 | 0.05 | 0.08 | 0.01 | 0.06 | 0.13 | 0.07 |
| PHRASE PHRASE | 0.36 | 0.36 | 0.30 | 0.25 | 0.27 | 0.36 | 0.36 | 0.37 | 0.32 |
| **ALL rules, nouns counted once (best rule)** | 9.55 | 9.11 | 6.45 | 5.51 | 7.02 | 2.83 | 4.69 | 9.11 | 6.43 |
| **conservative set (no N-bare, no PHRASE)** | 4.22 | 4.22 | 3.03 | 2.47 | 3.01 | 1.83 | 2.56 | 4.23 | 3.06 |

### fr

F3 and F1+NMT columns are estimated on a seeded random subset of 2500 sentences (48984 words; 1901/1901 F1 sentences translated); the F1/F2 columns are over the whole corpus. 'subset' rows show F1/F2 on the same subset for comparison.

| class / rule | F0 (naive) | F1 | F2 | F3 | F1+NMT | F2syn3 | F2syn5 | F1 subset | F2 subset |
|---|---|---|---|---|---|---|---|---|---|
| NOUN N-bare | 5.87 | 5.80 | 3.69 | 3.34 | 4.57 | 0.80 | 2.20 | 5.80 | 3.70 |
| NOUN N-det | 1.10 | 1.10 | 0.67 | 0.60 | 0.86 | 0.14 | 0.37 | 1.09 | 0.65 |
| NOUN N-adj | 0.17 | 0.17 | 0.06 | 0.07 | 0.14 | 0.00 | 0.03 | 0.19 | 0.08 |
| ADJ ADJ-pred | 0.25 | 0.08 | 0.05 | 0.04 | 0.05 | 0.02 | 0.04 | 0.08 | 0.05 |
| ADV ADV-tok | 1.30 | 1.16 | 0.84 | 0.61 | 0.70 | 0.66 | 0.91 | 1.11 | 0.80 |
| CONN CONN-tok | 1.06 | 1.05 | 0.81 | 0.51 | 0.54 | 0.97 | 1.04 | 1.08 | 0.83 |
| VERB V-inf | 0.58 | 0.53 | 0.35 | 0.28 | 0.35 | 0.03 | 0.11 | 0.54 | 0.37 |
| VERB V-pres | 0.14 | 0.14 | 0.09 | 0.07 | 0.08 | 0.01 | 0.06 | 0.13 | 0.09 |
| PHRASE PHRASE | 0.36 | 0.36 | 0.29 | 0.19 | 0.22 | 0.36 | 0.36 | 0.37 | 0.30 |
| **ALL rules, nouns counted once (best rule)** | 9.55 | 9.11 | 6.09 | 5.01 | 6.50 | 2.83 | 4.69 | 9.11 | 6.12 |
| **conservative set (no N-bare, no PHRASE)** | 4.22 | 4.22 | 2.87 | 2.18 | 2.72 | 1.83 | 2.56 | 4.23 | 2.88 |

### de

F3 and F1+NMT columns are estimated on a seeded random subset of 2500 sentences (48984 words; 1901/1901 F1 sentences translated); the F1/F2 columns are over the whole corpus. 'subset' rows show F1/F2 on the same subset for comparison.

| class / rule | F0 (naive) | F1 | F2 | F3 | F1+NMT | F2syn3 | F2syn5 | F1 subset | F2 subset |
|---|---|---|---|---|---|---|---|---|---|
| NOUN N-bare | 5.87 | 5.80 | 3.61 | 2.73 | 3.76 | 0.80 | 2.20 | 5.80 | 3.54 |
| NOUN N-det | 0.84 | 0.84 | 0.52 | 0.44 | 0.61 | 0.10 | 0.29 | 0.82 | 0.50 |
| NOUN N-adj | 0.10 | 0.10 | 0.03 | 0.03 | 0.05 | 0.00 | 0.01 | 0.11 | 0.04 |
| ADJ ADJ-pred | 0.25 | 0.08 | 0.05 | 0.05 | 0.06 | 0.02 | 0.04 | 0.08 | 0.06 |
| ADV ADV-tok | 1.30 | 1.16 | 0.86 | 0.61 | 0.74 | 0.66 | 0.91 | 1.11 | 0.82 |
| CONN CONN-tok | 1.06 | 1.05 | 0.75 | 0.63 | 0.89 | 0.97 | 1.04 | 1.08 | 0.79 |
| VERB V-inf | 0.58 | 0.53 | 0.30 | 0.23 | 0.33 | 0.03 | 0.11 | 0.54 | 0.33 |
| VERB V-pres | 0.14 | 0.14 | 0.08 | 0.06 | 0.08 | 0.01 | 0.06 | 0.13 | 0.08 |
| PHRASE PHRASE | 0.36 | 0.36 | 0.23 | 0.12 | 0.20 | 0.36 | 0.36 | 0.37 | 0.23 |
| **ALL rules, nouns counted once (best rule)** | 9.55 | 9.11 | 5.88 | 4.43 | 6.05 | 2.84 | 4.70 | 9.11 | 5.83 |
| **conservative set (no N-bare, no PHRASE)** | 3.89 | 3.89 | 2.60 | 2.06 | 2.76 | 1.79 | 2.46 | 3.87 | 2.62 |

## Precision (judged samples)

### es (judge: sonnet)

| class / rule | n judged | F0 | F1 | F2 | F3 | F1+NMT | F2syn3 | F2syn5 | n(F3) |
|---|---|---|---|---|---|---|---|---|---|
| NOUN N-bare | 50 | 59.2% | 60.0% [46-72] n=50 | 67.6% [51-80] n=37 | 69.4% [53-82] n=36 | 65.2% [51-77] n=46 | 100.0% [61-100] n=6 | 86.7% [62-96] n=15 | 36 |
| NOUN N-det | 50 | =F1 | 66.0% [52-78] n=50 | 80.0% [63-90] n=30 | 84.6% [66-94] n=26 | 71.4% [56-83] n=42 | 100.0% [65-100] n=7 | 81.2% [57-93] n=16 | 26 |
| NOUN N-adj | 20 | =F1 | 55.0% [34-74] n=20 | 88.9% [56-98] n=9 | 100.0% [65-100] n=7 | 72.7% [43-90] n=11 | n/a | 100.0% [21-100] n=1 | 7 |
| ADJ ADJ-pred | 60 | 19.6% | 63.3% [51-74] n=60 | 78.4% [63-89] n=37 | 84.8% [69-93] n=33 | 81.4% [67-90] n=43 | 50.0% [25-75] n=12 | 58.6% [41-74] n=29 | 33 |
| ADV ADV-tok | 50 | 67.3% | 74.0% [60-84] n=50 | 89.7% [76-96] n=39 | 92.6% [77-98] n=27 | 92.6% [77-98] n=27 | 74.2% [57-86] n=31 | 76.2% [61-87] n=42 | 27 |
| CONN CONN-tok | 50 | 79.4% | 80.0% [67-89] n=50 | 94.6% [82-99] n=37 | 97.1% [85-99] n=34 | 90.0% [77-96] n=40 | 82.2% [69-91] n=45 | 83.3% [70-91] n=48 | 34 |
| VERB V-inf | 50 | 54.0% | 58.0% [44-71] n=50 | 70.0% [52-83] n=30 | 75.0% [51-90] n=16 | 68.0% [48-83] n=25 | 100.0% [21-100] n=1 | 50.0% [15-85] n=4 | 16 |
| VERB V-pres | 50 | =F1 | 70.0% [56-81] n=50 | 82.8% [65-92] n=29 | 86.4% [67-95] n=22 | 78.4% [63-89] n=37 | 100.0% [57-100] n=5 | 63.2% [41-81] n=19 | 22 |
| PHRASE PHRASE | 20 | =F1 | 60.0% [39-78] n=20 | 62.5% [39-82] n=16 | 75.0% [47-91] n=12 | 78.6% [52-92] n=14 | 60.0% [39-78] n=20 | 60.0% [39-78] n=20 | 12 |
| ALL (sample mean) | 400 | 61.7% (F1 pop-weighted 64.2%) | 66.2% [61-71] n=400 | 79.9% [75-84] n=264 | 84.5% [79-89] n=213 | 77.5% [72-82] n=285 | 76.4% [68-83] n=127 | 73.2% [67-79] n=194 | 213 |
| F0-only items (POS mismatch, judged separately) | 40 | 2.5% [0-13] | | | | | | | |

Error types among judged items at each level (share of judged items at that level):

| level | n | correct | wrong_sense | wrong_gender | wrong_number | wrong_case | wrong_conjugation | wrong_order_or_awkward | should_not_swap_other |
|---|---|---|---|---|---|---|---|---|---|
| F1 | 400 | 66.2% | 23.2% | 0.2% | 1.5% | 0.0% | 1.5% | 6.5% | 0.8% |
| F2 | 264 | 79.9% | 10.6% | 0.4% | 0.8% | 0.0% | 1.9% | 5.3% | 1.1% |
| F3 | 213 | 84.5% | 8.5% | 0.5% | 0.5% | 0.0% | 0.5% | 4.2% | 1.4% |
| F1+NMT | 285 | 77.5% | 13.3% | 0.4% | 1.8% | 0.0% | 0.7% | 5.3% | 1.1% |
| F0-only | 40 | 2.5% | 77.5% | 0.0% | 2.5% | 0.0% | 2.5% | 7.5% | 7.5% |

### fr (judge: sonnet)

| class / rule | n judged | F0 | F1 | F2 | F3 | F1+NMT | F2syn3 | F2syn5 | n(F3) |
|---|---|---|---|---|---|---|---|---|---|
| NOUN N-bare | 50 | 59.2% | 60.0% [46-72] n=50 | 70.6% [54-83] n=34 | 75.0% [58-87] n=32 | 72.5% [57-84] n=40 | 83.3% [44-97] n=6 | 80.0% [55-93] n=15 | 32 |
| NOUN N-det | 50 | =F1 | 70.0% [56-81] n=50 | 90.0% [74-97] n=30 | 100.0% [87-100] n=25 | 85.7% [71-94] n=35 | 85.7% [49-97] n=7 | 93.8% [72-99] n=16 | 25 |
| NOUN N-adj | 20 | =F1 | 50.0% [30-70] n=20 | 100.0% [57-100] n=5 | 100.0% [51-100] n=4 | 75.0% [47-91] n=12 | n/a | 100.0% [21-100] n=1 | 4 |
| ADJ ADJ-pred | 60 | 20.1% | 65.0% [52-76] n=60 | 76.3% [61-87] n=38 | 86.2% [69-95] n=29 | 82.4% [66-92] n=34 | 50.0% [25-75] n=12 | 58.6% [41-74] n=29 | 29 |
| ADV ADV-tok | 50 | 72.3% | 76.0% [63-86] n=50 | 82.5% [68-91] n=40 | 87.9% [73-95] n=33 | 88.9% [75-96] n=36 | 71.0% [53-84] n=31 | 73.8% [59-85] n=42 | 33 |
| CONN CONN-tok | 50 | 81.4% | 82.0% [69-90] n=50 | 97.0% [85-99] n=33 | 100.0% [85-100] n=21 | 100.0% [87-100] n=25 | 84.4% [71-92] n=45 | 85.4% [73-93] n=48 | 21 |
| VERB V-inf | 50 | 54.4% | 58.0% [44-71] n=50 | 75.8% [59-87] n=33 | 76.9% [58-89] n=26 | 68.8% [51-82] n=32 | 100.0% [21-100] n=1 | 100.0% [51-100] n=4 | 26 |
| VERB V-pres | 50 | =F1 | 82.0% [69-90] n=50 | 91.9% [79-97] n=37 | 93.8% [80-98] n=32 | 85.7% [72-93] n=42 | 80.0% [38-96] n=5 | 89.5% [69-97] n=19 | 32 |
| PHRASE PHRASE | 20 | =F1 | 40.0% [22-61] n=20 | 61.5% [36-82] n=13 | 71.4% [36-92] n=7 | 45.5% [21-72] n=11 | 40.0% [22-61] n=20 | 40.0% [22-61] n=20 | 7 |
| ALL (sample mean) | 400 | 62.1% (F1 pop-weighted 64.4%) | 67.8% [63-72] n=400 | 82.5% [77-87] n=263 | 87.6% [82-91] n=209 | 80.9% [76-85] n=267 | 70.9% [62-78] n=127 | 75.3% [69-81] n=194 | 209 |
| F0-only items (POS mismatch, judged separately) | 40 | 7.5% [3-20] | | | | | | | |

Error types among judged items at each level (share of judged items at that level):

| level | n | correct | wrong_sense | wrong_gender | wrong_number | wrong_case | wrong_conjugation | wrong_order_or_awkward | should_not_swap_other |
|---|---|---|---|---|---|---|---|---|---|
| F1 | 400 | 67.8% | 26.0% | 0.5% | 1.8% | 0.0% | 0.5% | 3.2% | 0.2% |
| F2 | 263 | 82.5% | 9.5% | 0.8% | 1.9% | 0.0% | 0.8% | 4.2% | 0.4% |
| F3 | 209 | 87.6% | 5.3% | 1.0% | 1.9% | 0.0% | 1.0% | 2.9% | 0.5% |
| F1+NMT | 267 | 80.9% | 12.7% | 0.7% | 2.2% | 0.0% | 0.7% | 2.2% | 0.4% |
| F0-only | 40 | 7.5% | 70.0% | 0.0% | 0.0% | 0.0% | 7.5% | 5.0% | 10.0% |

### de (judge: sonnet)

| class / rule | n judged | F0 | F1 | F2 | F3 | F1+NMT | F2syn3 | F2syn5 | n(F3) |
|---|---|---|---|---|---|---|---|---|---|
| NOUN N-bare | 50 | 57.2% | 58.0% [44-71] n=50 | 62.1% [44-77] n=29 | 66.7% [45-83] n=21 | 67.7% [50-81] n=31 | 55.6% [27-81] n=9 | 60.0% [39-78] n=20 | 21 |
| NOUN N-det | 50 | =F1 | 86.0% [74-93] n=50 | 96.7% [83-99] n=30 | 96.4% [82-99] n=28 | 91.9% [79-97] n=37 | 100.0% [51-100] n=4 | 93.8% [72-99] n=16 | 28 |
| NOUN N-adj | 20 | =F1 | 95.0% [76-99] n=20 | 100.0% [61-100] n=6 | 100.0% [57-100] n=5 | 100.0% [80-100] n=15 | 100.0% [21-100] n=1 | 100.0% [44-100] n=3 | 5 |
| ADJ ADJ-pred | 60 | 23.7% | 76.7% [65-86] n=60 | 85.4% [72-93] n=41 | 90.9% [76-97] n=33 | 87.5% [74-95] n=40 | 80.0% [55-93] n=15 | 74.1% [55-87] n=27 | 33 |
| ADV ADV-tok | 50 | 72.8% | 82.0% [69-90] n=50 | 85.3% [70-94] n=34 | 92.0% [75-98] n=25 | 91.4% [78-97] n=35 | 77.8% [59-89] n=27 | 76.9% [62-87] n=39 | 25 |
| CONN CONN-tok | 50 | 85.3% | 86.0% [74-93] n=50 | 90.5% [78-96] n=42 | 90.0% [74-97] n=30 | 90.9% [76-97] n=33 | 88.9% [77-95] n=45 | 87.5% [75-94] n=48 | 30 |
| VERB V-inf | 50 | 67.7% | 72.0% [58-83] n=50 | 88.9% [72-96] n=27 | 90.5% [71-97] n=21 | 85.3% [70-94] n=34 | 100.0% [34-100] n=2 | 80.0% [49-94] n=10 | 21 |
| VERB V-pres | 50 | =F1 | 64.0% [50-76] n=50 | 67.7% [50-81] n=31 | 73.9% [54-87] n=23 | 71.0% [53-84] n=31 | 50.0% [15-85] n=4 | 66.7% [42-85] n=15 | 23 |
| PHRASE PHRASE | 20 | =F1 | 80.0% [58-92] n=20 | 75.0% [47-91] n=12 | 100.0% [57-100] n=5 | 100.0% [76-100] n=12 | 80.0% [58-92] n=20 | 80.0% [58-92] n=20 | 5 |
| ALL (sample mean) | 400 | 65.4% (F1 pop-weighted 68.1%) | 76.2% [72-80] n=400 | 82.9% [78-87] n=252 | 87.4% [82-91] n=191 | 85.8% [81-89] n=268 | 81.1% [73-87] n=127 | 78.8% [73-84] n=198 | 191 |
| F0-only items (POS mismatch, judged separately) | 40 | 2.5% [0-13] | | | | | | | |

Error types among judged items at each level (share of judged items at that level):

| level | n | correct | wrong_sense | wrong_gender | wrong_number | wrong_case | wrong_conjugation | wrong_order_or_awkward | should_not_swap_other |
|---|---|---|---|---|---|---|---|---|---|
| F1 | 400 | 76.2% | 17.2% | 0.0% | 0.2% | 1.2% | 1.8% | 2.8% | 0.5% |
| F2 | 252 | 82.9% | 10.3% | 0.0% | 0.4% | 1.6% | 1.2% | 3.2% | 0.4% |
| F3 | 191 | 87.4% | 5.2% | 0.0% | 0.5% | 2.1% | 1.6% | 2.6% | 0.5% |
| F1+NMT | 268 | 85.8% | 6.7% | 0.0% | 0.4% | 1.9% | 1.9% | 3.0% | 0.4% |
| F0-only | 40 | 2.5% | 82.5% | 0.0% | 2.5% | 0.0% | 2.5% | 7.5% | 2.5% |

### All languages pooled

| class / rule | n judged | F0 | F1 | F2 | F3 | F1+NMT | F2syn3 | F2syn5 | n(F3) |
|---|---|---|---|---|---|---|---|---|---|
| NOUN N-bare | 150 | 58.6% | 59.3% [51-67] n=150 | 67.0% [57-75] n=100 | 70.8% [61-79] n=89 | 68.4% [59-76] n=117 | 76.2% [55-89] n=21 | 74.0% [60-84] n=50 | 89 |
| NOUN N-det | 150 | =F1 | 74.0% [66-80] n=150 | 88.9% [81-94] n=90 | 93.7% [86-97] n=79 | 82.5% [74-88] n=114 | 94.4% [74-99] n=18 | 89.6% [78-95] n=48 | 79 |
| NOUN N-adj | 60 | =F1 | 66.7% [54-77] n=60 | 95.0% [76-99] n=20 | 100.0% [81-100] n=16 | 84.2% [70-93] n=38 | 100.0% [21-100] n=1 | 100.0% [57-100] n=5 | 16 |
| ADJ ADJ-pred | 180 | 21.1% | 68.3% [61-75] n=180 | 80.2% [72-86] n=116 | 87.4% [79-93] n=95 | 83.8% [76-89] n=117 | 61.5% [46-75] n=39 | 63.5% [53-73] n=85 | 95 |
| ADV ADV-tok | 150 | 70.9% | 77.3% [70-83] n=150 | 85.8% [78-91] n=113 | 90.6% [83-95] n=85 | 90.8% [83-95] n=98 | 74.2% [64-82] n=89 | 75.6% [67-82] n=123 | 85 |
| CONN CONN-tok | 150 | 82.0% | 82.7% [76-88] n=150 | 93.8% [88-97] n=112 | 95.3% [89-98] n=85 | 92.9% [86-96] n=98 | 85.2% [78-90] n=135 | 85.4% [79-90] n=144 | 85 |
| VERB V-inf | 150 | 58.6% | 62.7% [55-70] n=150 | 77.8% [68-85] n=90 | 81.0% [70-89] n=63 | 74.7% [65-83] n=91 | 100.0% [51-100] n=4 | 77.8% [55-91] n=18 | 63 |
| VERB V-pres | 150 | =F1 | 72.0% [64-79] n=150 | 81.4% [73-88] n=97 | 85.7% [76-92] n=77 | 79.1% [71-86] n=110 | 78.6% [52-92] n=14 | 73.6% [60-84] n=53 | 77 |
| PHRASE PHRASE | 60 | =F1 | 60.0% [47-71] n=60 | 65.9% [51-78] n=41 | 79.2% [60-91] n=24 | 75.7% [60-87] n=37 | 60.0% [47-71] n=60 | 60.0% [47-71] n=60 | 24 |
| ALL (sample mean) | 1200 | 63.2% (F1 pop-weighted 65.7%) | 70.1% [67-73] n=1200 | 81.8% [79-84] n=779 | 86.5% [84-89] n=613 | 81.3% [79-84] n=820 | 76.1% [72-80] n=381 | 75.8% [72-79] n=586 | 613 |
| F0-only items (POS mismatch, judged separately) | 120 | 4.2% [2-9] | | | | | | | |

Error types among judged items at each level (share of judged items at that level):

| level | n | correct | wrong_sense | wrong_gender | wrong_number | wrong_case | wrong_conjugation | wrong_order_or_awkward | should_not_swap_other |
|---|---|---|---|---|---|---|---|---|---|
| F1 | 1200 | 70.1% | 22.2% | 0.2% | 1.2% | 0.4% | 1.2% | 4.2% | 0.5% |
| F2 | 779 | 81.8% | 10.1% | 0.4% | 1.0% | 0.5% | 1.3% | 4.2% | 0.6% |
| F3 | 613 | 86.5% | 6.4% | 0.5% | 1.0% | 0.7% | 1.0% | 3.3% | 0.8% |
| F1+NMT | 820 | 81.3% | 11.0% | 0.4% | 1.5% | 0.6% | 1.1% | 3.5% | 0.6% |
| F0-only | 120 | 4.2% | 76.7% | 0.0% | 1.7% | 0.0% | 4.2% | 6.7% | 6.7% |

## German case exposure (N-det/N-adj noun candidates that reached the case step)

| case | n | share | judged N-det/N-adj | correct | wrong_case | wrong_gender | other wrong |
|---|---|---|---|---|---|---|---|
| NOM | 1156 | 29.2% | 31 | 93.5% | 0.0% | 0.0% | 6.5% |
| ACC | 951 | 24.1% | 22 | 90.9% | 0.0% | 0.0% | 9.1% |
| DAT | 554 | 14.0% | 10 | 70.0% | 20.0% | 0.0% | 10.0% |
| GEN | 388 | 9.8% | 7 | 85.7% | 0.0% | 0.0% | 14.3% |
| ambiguous | 532 | 13.5% | 0 | n/a | n/a | n/a | n/a |
| unsupported | 373 | 9.4% | 0 | n/a | n/a | n/a | n/a |

Roles: subject=853, direct_object=786, prep_two_way=532, prep_of=353, predicate_nominative=303, prep_unmapped=180, prep_to=157, prep_at=120, prep_for=112, prep_by=95, prep_with=90, other_appos=75, prep_from=62, other_npadvmod=51, prep_during=35, other_ROOT=33, pobj_nonprep=18, prep_into=15, prep_about=14, prep_through=12, prep_between=8, prep_after=8, prep_among=7, other_dep=5, prep_against=5, prep_before=5, other_oprd=4, prep_without=4, prep_across=3, other_nmod=3, indirect_object=2, other_advmod=1, other_advcl=1, other_acl=1, other_acomp=1

Judged German N-det/N-adj by assigned case and label:

- NOM: n=31, labels={'correct': 29, 'wrong_sense': 2}
- ACC: n=22, labels={'correct': 20, 'wrong_sense': 2}
- DAT: n=10, labels={'correct': 7, 'wrong_sense': 1, 'wrong_case': 2}
- GEN: n=7, labels={'correct': 6, 'wrong_sense': 1}

## Verb-form exposure (pack verbs, all three languages see the same English)

| form | n | share | covered by rule |
|---|---|---|---|
| participle | 2340 | 26.2% | - |
| past | 1801 | 20.2% | - |
| gerund | 1482 | 16.6% | - |
| present_noun_subject | 799 | 9.0% | - |
| VB_to_inf | 730 | 8.2% | V-inf |
| VB_modal | 457 | 5.1% | V-inf |
| VB_other | 272 | 3.0% | - |
| present_rel_or_other_pron | 222 | 2.5% | - |
| phrasal | 209 | 2.3% | - |
| present_no_subject | 138 | 1.5% | - |
| VB_do_support | 122 | 1.4% | - |
| present_pron_2sg | 104 | 1.2% | V-pres |
| present_pron_3sg | 78 | 0.9% | V-pres |
| present_pron_1sg | 63 | 0.7% | V-pres |
| present_pron_3pl | 50 | 0.6% | V-pres |
| present_question | 11 | 0.1% | - |
| present_pron_1pl | 6 | 0.1% | V-pres |
| present_with_aux | 4 | 0.0% | - |
| present_pron_far | 3 | 0.0% | - |

Covered by V-inf + V-pres: 1488/8927 = 16.7% of pack-verb occurrences (es pack). Modal+negation inside V-inf: 36.

## Adjective-agreement exposure

| lang | noun opportunities | with adjective | with pack adjective | N-adj candidates | ADJ predicative seen | ADJ-pred candidates | attributive ADJ not swapped |
|---|---|---|---|---|---|---|---|
| es | 13987 | 4510 (32.2%) | 372 | 372 | 455 | 168 | 4524 |
| fr | 13987 | 4510 (32.2%) | 372 | 372 | 455 | 168 | 4524 |
| de | 13987 | 4510 (32.2%) | 290 | 219 | 455 | 168 | 4524 |

## Skipped opportunities by reason (per 100 words, es pack unless German-specific)

- es: ndet_no_simple_det=3.21, verb_participle=1.05, verb_past=0.81, verb_gerund=0.67, noun_compound_modifier=0.50, adj_comparative=0.45, ndet_other_modifier=0.38, ndet_other_det=0.37, verb_present_noun_subject=0.36, nadj_adj_not_in_pack=0.31, noun_excluded_in_quote=0.27, noun_excluded_hyphenated=0.21, adv_comparative=0.20, adj_other_position=0.17, nadj_complex_np=0.15, verb_excluded_in_quote=0.15, adj_excluded_hyphenated=0.13, pred_no_gendered_subject=0.13, adj_excluded_in_quote=0.12, verb_bare_other=0.12, verb_present_other_pron=0.10, verb_phrasal=0.09, verb_excluded_hyphenated=0.08, adv_excluded_in_quote=0.07, verb_present_no_subject=0.06
- fr: ndet_no_simple_det=3.21, verb_participle=1.05, verb_past=0.81, verb_gerund=0.67, noun_compound_modifier=0.50, adj_comparative=0.45, ndet_other_modifier=0.38, ndet_other_det=0.37, verb_present_noun_subject=0.36, nadj_adj_not_in_pack=0.31, noun_excluded_in_quote=0.27, noun_excluded_hyphenated=0.21, adv_comparative=0.20, adj_other_position=0.17, nadj_complex_np=0.15, verb_excluded_in_quote=0.15, adj_excluded_hyphenated=0.13, pred_no_gendered_subject=0.13, adj_excluded_in_quote=0.12, verb_bare_other=0.12, verb_present_other_pron=0.10, verb_phrasal=0.09, verb_excluded_hyphenated=0.08, adv_excluded_in_quote=0.07, verb_present_no_subject=0.06
- de: ndet_no_simple_det=3.21, verb_participle=1.05, verb_past=0.81, verb_gerund=0.67, noun_compound_modifier=0.50, adj_comparative=0.45, ndet_other_modifier=0.38, ndet_other_det=0.37, verb_present_noun_subject=0.36, noun_excluded_in_quote=0.27, nadj_adj_not_in_pack=0.24, de_case_ambiguous=0.24, noun_excluded_hyphenated=0.21, adv_comparative=0.20, de_case_unsupported=0.17, adj_other_position=0.17, verb_excluded_in_quote=0.15, adj_excluded_hyphenated=0.13, pred_no_gendered_subject=0.13, adj_excluded_in_quote=0.12, verb_bare_other=0.12, nadj_complex_np=0.12, verb_present_other_pron=0.10, verb_phrasal=0.09, verb_excluded_hyphenated=0.08

## Judge reliability (es, sonnet vs opus)

n=100; exact label agreement 80.0%; correct-vs-not agreement 80.0%; Cohen's kappa (correct-vs-not) 0.53; sonnet correct 63.0%, opus correct 77.0%.

Correct rate on the same 100 items by filter level (sonnet / opus):

| level | n | sonnet correct | opus correct | both correct | either wrong |
|---|---|---|---|---|---|
| F1 | 100 | 63.0% | 77.0% | 60.0% | 40.0% |
| F2 | 59 | 78.0% | 93.2% | 78.0% | 22.0% |
| F3 | 53 | 81.1% | 98.1% | 81.1% | 18.9% |
| F1+NMT | 81 | 70.4% | 87.7% | 69.1% | 30.9% |

Disagreement direction by rule (sonnet-wrong/opus-correct vs sonnet-correct/opus-wrong): N-adj 3/1; N-bare 7/0; N-det 7/2

Disagreements (english -> target: sonnet / opus, opus reason):

- the great work -> el gran trabajo: wrong_sense / correct; 'El gran trabajo' is an acceptable rendering of 'the great work' here.
- the middle period -> el período medio: wrong_sense / correct; 'El período medio' acceptably renders 'the middle period'.
- a later review -> una reseña posterior: correct / wrong_sense; A scholarly literature review is a 'revisión', not a 'reseña' of a work.
- a bad way -> una mala manera: wrong_sense / correct; 'Una mala manera' is correct in gender and sense.
- a game -> un juego: correct / wrong_sense; A single chess game is "una partida", not "un juego".
- the end -> el final: wrong_sense / correct; "El final" of the century is acceptable.
- the field -> el campo: wrong_sense / correct; "Campo" also means field of study in Spanish, so it is acceptable.
- the language -> el idioma: correct / wrong_sense; Python is a programming language, which is 'el lenguaje' in Spanish, not 'el idioma'.
- a body -> un cuerpo: wrong_sense / correct; 'un cuerpo de conocimientos' is an established Spanish expression.
- the light -> la luz: wrong_sense / correct; The idiom 'a la luz de' keeps 'la luz' as the rendering.
- the lands -> las tierras: wrong_sense / correct; 'las tierras' is right for confiscated lands, plural feminine.
- The book -> El libro: should_not_swap_other / correct; 'El libro' precedes the title correctly; the title itself is untouched.
- a way -> una manera: wrong_order_or_awkward / correct; "de una manera" correctly renders "in a way"; the preposition is not penalized.
- form -> forma: wrong_order_or_awkward / correct; "forma" fits the expression "en forma de".
- series -> serie: wrong_order_or_awkward / correct; "una serie de derrotas" is correct; the singular "serie" fits.
- world -> mundo: wrong_order_or_awkward / correct; 'around the world' maps to 'alrededor del mundo'.
- state -> estado: wrong_order_or_awkward / correct; 'estado' is the political state here.
- title -> título: wrong_sense / correct; 'título' is also the Spanish word for a championship title.
- part -> parte: wrong_sense / correct; 'as part of' maps to 'como parte de'.
- arts -> artes: wrong_sense / correct; 'in the arts' maps to 'en las artes'.

## Tagger comparison (compromise vs spaCy on judged items)

Pooled agreement: 0.8794 on n=1260.

| lang | agreement | spaCy-F1 precision | compromise-F1 precision (pop-weighted) | retained vs spaCy | F1 correct dropped | F1 wrong dropped | F0-only wrong admitted | F0-only correct admitted |
|---|---|---|---|---|---|---|---|---|
| es | 0.8786 | 0.6658 | 0.6704 | 0.9201 | 19/380 | 15/380 | 8/40 | 1/40 |
| fr | 0.8786 | 0.6921 | 0.699 | 0.9201 | 19/380 | 15/380 | 8/40 | 1/40 |
| de | 0.881 | 0.7605 | 0.7621 | 0.922 | 22/380 | 11/380 | 8/40 | 0/40 |

Top confusions (spaCy->compromise): NOUN->NOUN 118; VERB->VERB 108; ADJ->ADJ 58; ADV->ADV 54; SCONJ->CONJ 14; ADV->CONJ 11; NOUN->NOUN 118; VERB->VERB 108; ADJ->ADJ 58; ADV->ADV 54; SCONJ->CONJ 14; ADV->CONJ 11; NOUN->NOUN 122; VERB->VERB 107; ADJ->ADJ 54; ADV->ADV 53; ADV->CONJ 13; SCONJ->CONJ 13

## Failure examples (judged not correct, from the F2 or F3 sets where possible)

1. [de N-det F2=y F3=y] "Bicycle manufacturing proved to be a training ground for other industries and led to der Entwicklung of advanced metalworking techniques, both for the frames themselves and for special components such as ball bearings, washers, and sprockets." — swap the development -> der Entwicklung — **wrong_case**: 'led to the development' = 'zur Entwicklung' (dative); 'der Entwicklung' is dative but swallows the preposition 'zu' needing contraction; as span it is acceptable dative feminine.
2. [de N-bare F2=y F3=y] "The length of this varies between males of different Alter and conditions, lasting from days to months." — swap ages -> Alter — **wrong_number**: 'ages' plural; 'Alter' as plural of 'different ages' would be 'Altersstufen'; 'Alter' is singular, mismatch with 'different'.
3. [de N-bare F2=y F3=y] "Most bicycles have serial numbers that can be recorded to verify identity in Fall of theft." — swap case -> Fall — **wrong_sense**: 'in case of' is a fixed expression (im Falle von/bei), not 'in Fall of'.
4. [de N-bare F2=y F3=y] "Rich families from Rome usually had two or more houses: a townhouse (domus) and at least one luxury home (villa) outside the Stadt." — swap city -> Stadt — **wrong_case**: 'outside the city' requires 'außerhalb der Stadt' (genitive), but bare 'Stadt' lacks the article 'der' inside the span.
5. [de N-bare F2=y F3=y] "Continuing my analysis of the lists recommended by Tim, I compared his 100 Most Common Spoken Words in English list with his 100 Most Common Written Words in English Liste, and this is what I found:" — swap list -> Liste — **should_not_swap_other**: 'list' is the last word of a quoted list title, so it should stay English.
6. [de N-bare F2=y F3=y] "There was some controversy over the Spiel, and human–computer matches were relatively close over the next few years, until convincing computer victories in 2005 and in 2006." — swap match -> Spiel — **wrong_sense**: A chess match is 'Wettkampf/Match'; 'Spiel' is a single game.
7. [de ADJ-pred F2=y F3=y] "A successful shot is wert two points, or three points if it is taken from beyond the three-point arc 6.75 meters (22 ft 2 in) from the basket in international games and 23 feet 9 inches (7.24 m) in NBA games." — swap worth -> wert — **wrong_order_or_awkward**: German puts 'wert' after the amount ('zwei Punkte wert'). Here the amount follows it.
8. [de CONN-tok F2=y F3=y] "In Venus and Adonis, an innocent Adonis rejects the sexual advances of Venus; während in The Rape of Lucrece, the virtuous wife Lucrece is raped by the lustful Tarquin." — swap while -> während — **wrong_order_or_awkward**: 'while' here is contrastive; während works, but the swap is acceptable in sense. Accept as correct.
9. [de V-pres F2=y F3=y] "The point is that if you want fluency you brauchst a lot of words, a lot, and you need a lot of input." — swap need -> brauchst — **wrong_conjugation**: 'brauchst' is 2nd person singular; 'you' as generic subject is fine in German.
10. [de V-pres F2=y F3=y] "In English we geben this ability names like originality, creativity," — swap give -> geben — **wrong_conjugation**: Subject 'we' needs 'geben' — actually 1st person plural 'geben' is correct.
11. [es N-det F2=y F3=y] "Shakespeare's first plays were written in the conventional style of el día." — swap the day -> el día — **wrong_sense**: 'of the day' means 'of the time/era' (de la época); 'el día' is a literal rendering.
12. [es N-det F2=y F3=y] "Rhetoric was not so much un cuerpo of knowledge (though it required a command of the literary canon) as it was a mode of expression that distinguished those who held social power." — swap a body -> un cuerpo — **wrong_sense**: 'a body of knowledge' is figurative; Spanish uses 'un cuerpo de conocimientos', but 'cuerpo' is acceptable... however the gloss sense is physical body, so sense mismatch.
13. [es N-det F2=y F3=y] "El libro El Libro dels jochs partitis dels schachs en nombre de 100 was written by Francesc Vicent in Segorbe in 1495, but no copy of this work has survived." — swap The book -> El libro — **should_not_swap_other**: 'The book' precedes a title in a name; 'El libro El Libro...' is redundant and awkward.
14. [es N-bare F2=y F3=y] "In October 1797, a serie of defeats by Bonaparte in Italy led Austria to agree to the Treaty of Campo Formio, in which they formally ceded the Netherlands and recognised the Cisalpine Republic." — swap series -> serie — **wrong_order_or_awkward**: 'a series' needs 'una serie'; the article was dropped inside the span.
15. [es N-bare F2=y F3=y] "Images of hundreds queuing to reach the summit and reports of climbers stepping over dead bodies dismayed people around the mundo." — swap world -> mundo — **wrong_order_or_awkward**: 'the world' → 'el mundo' needs the article; 'the mundo' leaves the English article outside the span, and 'around the world' is a fixed phrase ('en todo el mundo').
16. [es ADJ-pred F2=y F3=y] "I believe this is similar to what Tim explains in his Judo vocab example." — swap similar -> similar — **should_not_swap_other**: Swap is identical to the English word; nothing visibly changed.
17. [es ADJ-pred F2=y F3=y] "A regulation basketball court in international games is 28 meters (92 feet) largo and 15 meters (49 feet) wide." — swap long -> largo — **wrong_gender**: 'cancha' is feminine, so it needs 'larga'.
18. [es ADJ-pred F2=y F3=y] "Volcanoes that, though large, are not grande enough to be called supervolcanoes, may also form calderas (collapsed crater) in the same way." — swap large -> grande — **wrong_number**: 'Volcanoes' is plural, so it needs 'grandes'.
19. [es V-pres F2=y F3=y] "you're stuck, just so you empiezas to get something done." — swap start -> empiezas — **wrong_conjugation**: 'so you start' purpose clause requires subjunctive 'empieces'.
20. [fr N-bare F2=y F3=y] "In October 1797, a série of defeats by Bonaparte in Italy led Austria to agree to the Treaty of Campo Formio, in which they formally ceded the Netherlands and recognised the Cisalpine Republic." — swap series -> série — **wrong_order_or_awkward**: "a series" -> "une série" requires the feminine article, but the article "a" was replaced by "a série", leaving the English article.

## F3 on judged items: NMT output availability

| lang | judged F1 items | with NMT output | judged F2 items | F2 with NMT output | F3 (F2 and NMT pass) |
|---|---|---|---|---|---|
| es | 400 | 400 | 264 | 264 | 213 |
| fr | 400 | 400 | 263 | 263 | 209 |
| de | 400 | 400 | 252 | 252 | 191 |

## Conservative deterministic configuration (CONN, ADV, N-det, N-adj; German NOM/ACC only)

Precision (correct rate, Wilson 95% CI). Sonnet rows use every judged conservative item at that level; Opus rows are the full re-judge of the conservative F2 items.

| lang | judge | F1 | F2 | F3 | F1+NMT (no F2) |
|---|---|---|---|---|---|
| es | sonnet | 71.2% [64-77] n=170 | 88.7% [82-93] n=115 | 92.6% [85-96] n=94 | 82.5% [75-88] n=120 |
| es | opus | - | 93.0% [87-96] n=115 | 97.9% [93-99] n=94 | - |
| fr | sonnet | 72.9% [66-79] n=170 | 89.8% [83-94] n=108 | 95.2% [88-98] n=83 | 88.9% [82-94] n=108 |
| fr | opus | - | 90.7% [84-95] n=108 | 95.2% [88-98] n=83 | - |
| de | sonnet | 86.9% [81-91] n=153 | 91.0% [84-95] n=100 | 93.6% [86-97] n=78 | 93.5% [87-97] n=108 |
| de | opus | - | 93.0% [86-97] n=100 | 97.4% [91-99] n=78 | - |
| **pooled** | sonnet | 76.7% [73-80] n=493 | 89.8% [86-93] n=323 | 93.7% [90-96] n=255 | 88.1% [84-91] n=336 |
| **pooled** | opus | - | 92.3% [89-95] n=323 | 96.9% [94-98] n=255 | - |

| rule | sonnet F2 | opus F2 | sonnet F3 | opus F3 |
|---|---|---|---|---|
| CONN-tok | 93.8% [88-97] n=112 | 94.6% [89-98] n=112 | 95.3% [89-98] n=85 | 96.5% [90-99] n=85 |
| ADV-tok | 85.8% [78-91] n=113 | 90.3% [83-94] n=113 | 90.6% [83-95] n=85 | 96.5% [90-99] n=85 |
| N-det | 88.5% [80-94] n=78 | 91.0% [83-96] n=78 | 94.2% [86-98] n=69 | 97.1% [90-99] n=69 |
| N-adj | 95.0% [76-99] n=20 | 95.0% [76-99] n=20 | 100.0% [81-100] n=16 | 100.0% [81-100] n=16 |

Sonnet/Opus correct-vs-not agreement on the conservative F2 items: 94.4% (n=323). Opus error types: {'wrong_order_or_awkward': 5, 'wrong_sense': 19, 'should_not_swap_other': 1}.

Retained opportunities per 100 words, conservative configuration (nouns once, N-adj over N-det; F3 word-scaled on the random subset):

| lang | F1 | F2 | F3 | F1+NMT |
|---|---|---|---|---|
| es | 3.48 | 2.58 | 2.15 | 2.57 |
| fr | 3.48 | 2.38 | 1.79 | 2.24 |
| de | 2.87 | 1.99 | 1.56 | 2.09 |

## Per-lemma precision (pooled, lemmas with >= 3 judged F1 items), worst first

172 lemmas with >= 3 judged items; full list in `per-lemma.csv`. Worst 45:

| lemma | class | n | correct | rate | dominant error | F2 n/correct |
|---|---|---|---|---|---|---|
| long | ADV | 8 | 0 | 0% | wrong_sense | 5/0 |
| as well | PHRASE | 8 | 0 | 0% | wrong_order_or_awkward | 8/0 |
| shot | NOUN | 7 | 0 | 0% | wrong_sense | 0/0 |
| keep | VERB | 7 | 0 | 0% | wrong_sense | 0/0 |
| a lot | PHRASE | 6 | 0 | 0% | wrong_sense | 3/0 |
| party | NOUN | 5 | 0 | 0% | wrong_sense | 0/0 |
| present | ADJ | 5 | 0 | 0% | wrong_number | 0/0 |
| process | NOUN | 4 | 0 | 0% | wrong_sense | 2/0 |
| issue | NOUN | 4 | 0 | 0% | wrong_sense | 0/0 |
| meet | VERB | 4 | 0 | 0% | wrong_sense | 0/0 |
| point | NOUN | 3 | 0 | 0% | wrong_sense | 0/0 |
| major | ADJ | 3 | 0 | 0% | wrong_sense | 1/0 |
| fine | ADJ | 3 | 0 | 0% | wrong_sense | 0/0 |
| too | ADV | 3 | 0 | 0% | wrong_sense | 0/0 |
| ago | ADV | 3 | 0 | 0% | wrong_order_or_awkward | 2/0 |
| turn | VERB | 3 | 0 | 0% | wrong_sense | 0/0 |
| set | VERB | 3 | 0 | 0% | wrong_sense | 0/0 |
| worth | ADJ | 9 | 1 | 11% | wrong_sense | 3/1 |
| term | NOUN | 7 | 1 | 14% | wrong_sense | 0/0 |
| likely | ADJ | 7 | 1 | 14% | wrong_sense | 7/1 |
| take | VERB | 7 | 1 | 14% | wrong_sense | 0/0 |
| yet | CONN | 6 | 1 | 17% | wrong_sense | 0/0 |
| work | NOUN | 5 | 1 | 20% | wrong_sense | 3/1 |
| come | VERB | 5 | 1 | 20% | wrong_sense | 3/1 |
| part | NOUN | 8 | 2 | 25% | wrong_sense | 4/1 |
| look | VERB | 4 | 1 | 25% | wrong_sense | 0/0 |
| more than | PHRASE | 6 | 2 | 33% | wrong_sense | 0/0 |
| period | NOUN | 3 | 1 | 33% | wrong_sense | 0/0 |
| due | ADJ | 3 | 1 | 33% | wrong_order_or_awkward | 0/0 |
| wrong | ADJ | 3 | 1 | 33% | wrong_sense | 1/1 |
| far | ADV | 3 | 1 | 33% | wrong_sense | 1/1 |
| back | ADV | 3 | 1 | 33% | wrong_sense | 1/1 |
| form | NOUN | 8 | 3 | 38% | wrong_sense | 0/0 |
| make | VERB | 14 | 6 | 43% | wrong_sense | 0/0 |
| way | NOUN | 9 | 4 | 44% | wrong_sense | 0/0 |
| instead | CONN | 9 | 4 | 44% | wrong_sense | 3/3 |
| give | VERB | 8 | 4 | 50% | wrong_sense | 8/4 |
| seem | VERB | 8 | 4 | 50% | wrong_order_or_awkward | 8/4 |
| free | ADJ | 6 | 3 | 50% | wrong_sense | 0/0 |
| old | ADJ | 4 | 2 | 50% | wrong_sense | 2/2 |
| rather | ADV | 4 | 2 | 50% | wrong_sense | 1/1 |
| support | VERB | 4 | 2 | 50% | wrong_sense | 4/2 |
| return | VERB | 4 | 2 | 50% | wrong_sense | 0/0 |
| able | ADJ | 9 | 5 | 56% | wrong_sense | 6/3 |
| until | CONN | 9 | 5 | 56% | wrong_order_or_awkward | 3/2 |

Lemmas under 50% correct: 36 of 172.

## Idiom / multiword-expression exposure (MWE blocklist)

112 expressions in `mwe_blocklist.txt`. An item is blocked when its span overlaps an occurrence. PHRASE-rule items are excluded (they are themselves MWEs).

| lang | F2 judged (non-phrase) | F2 wrong | wrong inside MWE | wrong_sense inside MWE | correct inside MWE | F2 precision before -> after blocklist |
|---|---|---|---|---|---|---|
| es | 248 | 47 | 11 | 10 | 4 | 81.0% -> 84.5% |
| fr | 250 | 41 | 6 | 6 | 6 | 83.6% -> 85.3% |
| de | 240 | 40 | 3 | 3 | 1 | 83.3% -> 84.3% |
| **pooled** | 738 | 128 | 20 | 19 | 11 | 82.7% -> 84.7% |

Most-hit expressions among F2 errors: no longer (3), in the face of (2), as part of (2), on the model of (2), in other words (2), give rise to (2), of the day (1), in the light of (1), in the middle of (1), around the world (1), part of (1), as long as (1), in case of (1)

- es: 396 of 15427 F2 candidates (2.6%) sit inside a listed MWE (0.18 per 100 words).
- fr: 262 of 14562 F2 candidates (1.8%) sit inside a listed MWE (0.12 per 100 words).
- de: 316 of 13792 F2 candidates (2.3%) sit inside a listed MWE (0.14 per 100 words).
