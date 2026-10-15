# Language Weave: literature review

Date: 2026-10-15 (America/New_York).
Scope: what peer-reviewed research says about the eight questions behind a word-swap ("diglot weave") browser extension.
Method: web search plus direct reading of primary PDFs where available. Numbers come from the primary text unless marked "secondary". Each claim carries a confidence tag.

Confidence tags:
- **high**: read in the primary paper (full text or publisher abstract) and the number is explicit.
- **medium**: from a publisher abstract, a meta-analysis's summary of the study, or a reputable secondary source; not checked against the primary table.
- **low**: single small study, promotional source, or a figure I could not trace to a primary source.

Inspiration sources read: Ferriss (2009) blog post; `jackieoliver/french-weave` README. The french-weave README does not specify a 700 ms hover delay; it describes "hover for the meaning", a 20-word learning cap, at most 5 new words per day, and promotion to "known" after 3 exposure days without a flip or peek.

---

## 1. Lexical coverage and reading comprehension

### Thresholds

- **Laufer (1989)** proposed 95% coverage as the point at which "readers" (scoring at least 55% on a comprehension test) outnumbered "non-readers". *Secondary* via Schmitt, Jiang & Grabe (2011) and Laufer & Ravenhorst-Kalovski (2010). **medium**
- **Hu & Nation (2000)**, *Reading in a Foreign Language* 13(1), 403–430. 66 pre-university learners in New Zealand read a 673-word story at 80/90/95/100% coverage (nonwords replaced real words). Mean scores (multiple choice out of 14; written recall out of 124): 80% = 6.06, 24.60; 90% = 9.50, 51.31; 95% = 10.18, 61.00; 100% = 12.24, 77.17. Nobody reached "adequate" comprehension at 80%; 3/16 (19%) did at 90%; 35–41% did at 95%. The 98% figure was *inferred by regression*, not tested directly. Numbers quoted from Schmitt et al. (2011, p. 28) and Kremmel et al. (2023); the primary PDF is a scan without a text layer. **high** for the numbers as reported by those two papers.
- **Kremmel, Indrarathne, Kormos & Suzuki (2023)**, *Language Learning* 73(4), 1127–1163. Replication with 104 Sri Lankan adult learners, adding a 98% condition and an informational text. Narrative multiple-choice accuracy: 80% = .497, 90% = .689, 95% = .646, 98% = .673, 100% = .763. Only the 80% vs 90% contrast was significant for that task (b = −0.974, p = .004). No condition reached their 85% "adequate comprehension" criterion. Conclusion: "the results of the original study could not be fully replicated"; coverage and comprehension look roughly linear, not thresholded. **high**
- **Schmitt, Jiang & Grabe (2011)**, *Modern Language Journal* 95(1), 26–43. 661 participants in 8 countries; coverage computed per person from a vocabulary measure. Comprehension rose from about 50% at 90% coverage to about 75% at 100% coverage, "a remarkably consistent linear relationship" with no threshold. Their rule: if 60% comprehension is adequate, 95% coverage suffices; if 70% is required, 98–99% coverage is needed. Valid only within the 90–100% band. **high**
- **Laufer & Ravenhorst-Kalovski (2010)**, *Reading in a Foreign Language* 22(1), 15–30. 745 Israeli college students. Vocabulary size vs mean reading score (out of 150): 1,000 families = 83; 2,000 = 90; 3,000 = 102; 4,000 = 111; 5,000 = 122; 7,000 = 138. Correlation r = .8 (R² = 64%). Each extra 1,000 families adds less coverage but the reading score keeps rising (7, 12.3, then ~10 points per 1,000). Two thresholds proposed: **optimal** 8,000 families → 98% coverage (incl. proper nouns); **minimal** 4,000–5,000 families → 95%. **high**

Takeaway: 95% and 98% are not cliffs. They are convenient points on a roughly linear curve. Below 90% coverage, reading becomes an "extreme handicap" (Schmitt et al. 2011 reading Hu & Nation). **high**

### How many word families, and what the top bands cover

- **Nation (2006)**, *Canadian Modern Language Review* 63(1), 59–82. Using fourteen 1,000-family BNC lists: 8,000–9,000 families for 98% of written text; 6,000–7,000 for spoken. Novel (*Lady Chatterley's Lover*), cumulative coverage excluding / including proper nouns: 1st 1,000 = 80.88% / 82.93%; 2,000 = 88.09 / 90.14; 3,000 = 91.23 / 93.28; 4,000 = 93.01 / 95.06; 9,000 = 96.17 / 98.22. Newspapers (five corpora): 2,000 families = 81.5–84.3%; 4,000 + proper nouns ≈ 94–95.4%; 8,000 + proper nouns ≈ 97.3–98.3%; proper nouns alone 4.6–6.1%. Summary: "The first 1,000 plus proper nouns cover 78%–81% of written text, and around 85% of spoken text." **high**
- **Nation (2001)**, *Learning Vocabulary in Another Language*, Table 1.4, based on Carroll, Davies & Richman (1971; 5-million-word corpus of US school materials): 10 words = 23.7%; 100 words = 49%; 1,000 = 74.1%; 2,000 = 81.3%; 3,000 = 85.2%; 4,000 = 87.6%; 5,000 = 89.4%; 12,448 = 95%; 43,831 = 99%; 86,741 types = 100%. **high** (read in the publisher sample chapter)
- **Nation & Waring (1997)** Brown-corpus table (Francis & Kučera 1982, lemmas): 1,000 = 72.0%; 2,000 = 79.7%; 3,000 = 84.0%; 4,000 = 86.8%; 5,000 = 88.7%; 6,000 = 89.9%. The GSL 2,000 covers 78–92% of written texts, "averaging around 82%", and ~96% of informal speech. **high**
- Function words: about 165 of the 2,000 GSL families are function words (Nation 2001). In Schmitt et al. (2011) function words made up 39.89% (302/757) and 46.05% (268/582) of the tokens in their two texts. So nearly half of running text is function words, and the "top 100 = 50%" claim is mostly function words. **high**
- **Brysbaert, Stevens, Mandera & Keuleers (2016)**, *Frontiers in Psychology* 7:1116. A 20-year-old American knows ~42,000 lemmas (range 27,000–52,000) from ~11,100 families; adults add ~6,000 lemmas between 20 and 60 (about one per two days). Useful as an L1 ceiling, not a coverage source. I did not find a Brysbaert coverage-by-band table. **high** for the vocabulary-size numbers.

### Other languages

- **French**: Cobb (2026, *Modern Language Journal*, "A nuclear families word list for French") reports 3,000 French lemmas reach 95% in a *Le Devoir* article, 4,000 in *L'Étranger*, 6,000 in *Le Monde*; a 3,000-family list gives 96–98% across text types. From the search abstract only. **medium**
- Lemma counts run roughly double family counts for the same coverage (secondary rule of thumb). **low**
- I found no 95/98% threshold studies for Spanish, German or Italian in this pass. English figures should not be assumed to transfer; richer morphology shifts the counts. **unverified**

---

## 2. Incidental vocabulary learning from reading

### How many encounters

- **Webb (2007)**, *Applied Linguistics* 28(1), 46–65. 121 Japanese learners; nonwords met 1, 3, 7 or 10 times; ten tests across five knowledge aspects. Gains at every step. "If learners encounter unknown words ten times in context, sizeable learning gains may occur. However, to develop full knowledge of a word more than ten repetitions may be needed." **high** (publisher abstract)
- **Waring & Takaki (2003)**, *Reading in a Foreign Language* 15(2), 130–163. 15 Japanese learners read a 400-headword graded reader (~96% coverage) with 25 pseudoword substitutions. Mean scores out of 25: form recognition 15.3 → 11.1 (1 week) → 8.4 (3 months); multiple-choice meaning 10.6 → 7.9 → 6.1; translation (recall) 4.6 → 1.9 → 0.9. No word met fewer than 8 times had its meaning recalled at 3 months. Form recognition at 3 months by frequency (max 5): 15–18 encounters = 2.3; 8–10 = 2.1; 4–5 = 1.2; once = 1.0. **high**
- **Pellicer-Sánchez & Schmitt (2010)**, *Reading in a Foreign Language* 22(1), 31–55. 20 advanced Spanish learners read *Things Fall Apart* (Ibo words as targets). For words met more than 10 times: meaning recognition 84%, spelling recognition 76%, meaning recall 55%, word-class recall 63%. 10–17 exposures significantly outperformed fewer. **high**
- **Uchihara, Webb & Yanagisawa (2019)**, *Language Learning* 69(3), 559–599. Meta-analysis, 45 effect sizes, 26 studies, N = 1,918. Mean correlation between number of encounters and learning r = .34 (medium). Moderators: learner age and vocabulary knowledge, spaced learning, visual support, engagement, range of encounters, nonword use, test forewarning, test format. **high** (abstract). Reported r = .41 for reading specifically. **medium** (secondary)
- **Webb, Uchihara & Yanagisawa (2023)**, *Language Teaching* 56(2), 161–180. Meta-analysis, 24 studies, 29 effect sizes, N = 2,771. Overall g = 1.14 (immediate), 0.93 (delayed). Proportion of target words learned: 9–18% immediate, 6–17% delayed. Reading: 17% immediate, 15% delayed. By test: form recognition 18% → 6%; meaning recognition 15% → 17%; meaning recall 9% → 12%. Spaced encounters g = 1.51 vs massed 0.97 (immediate); on delayed tests spaced g = 1.71 vs massed 0.58 (p = .013). Beyond-basic learners g = 1.40 vs basic 0.70 (p = .051). Viewing (video) was weakest (7%, 5%). **high**
- **Nation (2014)**, *Reading in a Foreign Language* 26(2), 1–16. Takes 12 repetitions as a "moderately safe" minimum. Tokens needed for an average of 12 repetitions in novels: 2nd 1,000 = 171,411; 3rd = 300,219; 4th = 534,697; 5th = 1,061,382; 6th = 1,450,068; 7th = 2,035,809; 8th = 2,427,807; 9th = 2,956,908. At 200 wpm: 21 minutes per week for the 2nd 1,000, rising to 6 h 10 min per week for the 9th 1,000. He treats 1,000 families per year as an optimistic L2 goal and notes "there is no published research to support this figure for learners of English as a foreign language." **high**

Takeaway: incidental reading alone converts roughly 10–15% of unknown words met into recallable meaning, and most retained words were met 8–10+ times. A swap extension controls repetition directly, which is the lever ordinary reading lacks. **high**

### Moderators

- **Glossing**: Yanagisawa, Webb & Uchihara (2020), *Studies in Second Language Acquisition* 42(2), 411–438. Meta-regression, 42 studies, 359 effect sizes, N = 3,802. Glossed reading: 45.3% of target words learned (immediate), 33.4% (delayed); unglossed: 26.6%, 19.8%. L1 glosses beat L2 glosses. Multiple-choice glosses were the most effective type; in-text glosses and glossaries the least. No difference among textual, pictorial and auditory modes. **high** (ERIC abstract)
- **Spacing of encounters inside text**: Nakata & Elgort (2021), *Second Language Research* 37(2). Japanese learners met 48 novel items in sentences with feedback. Spaced beat massed on meaning recall and meaning–form matching; semantic priming (tacit knowledge) was equal. **high** (abstract). Webb et al. (2023) also found spaced > massed (above).
- **Salience / typographical enhancement**: a 2025 meta-analysis of textual enhancement (29 studies, 1,749 participants) reports g = 0.54 overall for L2 development, not vocabulary-specific; authors not verified. An eye-tracking study found bolded/highlighted words drew longer fixations early but the difference faded with prolonged exposure. **low** on both. Enhancement in captioned video helped form recognition and meaning recall more than meaning recognition (Li, *Journal of Language and Education*). **low**
- **Retrieval during reading**: no incidental-reading meta-analysis isolates retrieval; the evidence sits in section 5. The glossing result that multiple-choice glosses beat passive glosses is the closest in-text analogue. **medium**
- **Part of speech in incidental reading**: Kweon & Kim (2008), *Reading in a Foreign Language* 20(2): 12 Korean learners reading authentic texts; nouns "a little easier to retain than verbs and adjectives"; more frequent words learned more easily. **medium**

---

## 3. The diglot weave method and mixed-language reading

### Burling's proposal

- **Burling (1968)**, "Some outlandish proposals for the teaching of foreign languages", *Language Learning* 18(1–2), 61–75. Abstract defends three propositions: (1) reading-only courses are legitimate; (2) passive knowledge can run far ahead of active ability; (3) grammar, lexicon and phonology can be learned "in greater independence of one another than is often assumed". He proposes courses "which first teach the recognition of grammatical forms, then the recognition of lexicon". So Burling's original ordering was **grammar/function words first, content vocabulary second**, the opposite of most modern "weave" apps. **high** (publisher abstract via OpenAlex)
- **Burling (1978)**, "An introductory course in reading French", *Language Learning* 28(1). Texts "begin with English words in French word order, and in subsequent passages a few French words are substituted for the English words. Later the proportion of French gradually rises." Adults can use adult material from day one; grammar is introduced systematically; the main disadvantage is "the unaesthetic appearance of the mixed texts". **high** (abstract). Burling (1982) *Sounding Right* (Newbury House) is the book-length version. **medium**
- Bradley (2003, *Humanising Language Teaching*) reports Burling's 1978 example beginning "Le weather was so warm, so clear!" — articles inserted first. Her own classroom trial: 18 biology students, 21 diglot exercise sets over 26 weeks; the experimental group scored higher on an in-class reading test, but no scores or control-group size are given. **low**

### Empirical studies of diglot weave

- **Christensen, Merrill & Yanchar (2007)**, *Computer Assisted Language Learning* 20(1), 67–77. College Spanish learners; a computer-based diglot reader vs a drill-and-practice program. The diglot reader "was equally as effective as the drill and practice program in facilitating vocabulary acquisition" and had a "positive affective benefit". No sample size or effect size in the abstract. **medium**
- **Nemati & Maleki (2013)**, *Journal of American Science* 9(1s). 60 Iranian first-year high-school students, 30 per group, five weekly sessions, six new words per session. Vocabulary test (max 30): experimental 8.60 → 23.03; control 8.67 → 12.17. ANCOVA group effect F(1,57) = 213.4, p = .001. Attitude also improved. Very large effect in a small, single-site, non-blind study; treat as existence proof only. **low–medium**
- Indonesian classroom comparisons (semantic mapping vs diglot weave; STAD vs diglot weave) report diglot weave ahead, but samples are 40–74 students, single site, with weak reporting. **low**
- **Ji Yuhua's "sandwich stories" (三明治故事)**: Ji (1999), "Communicative language-teaching through sandwich stories for EFL children in China", *TESL Canada Journal* 17(1). Chinese narrative with English words and phrases embedded, increasing over time; listed by China's Ministry of Education as a recognised method in 2002 (secondary). I found no controlled study with effect sizes. **low** on efficacy; **medium** on description.

### HCI and NLP work on in-place word substitution (the closest analogues to a browser extension)

- **Trusty & Truong (2011)**, "Augmenting the web for second language vocabulary learning", CHI 2011. ALOE, a Firefox extension that replaced a selected set of English words with French on pages the user already read. Two-month deployment: "most participants were able to learn an average of 50 new French vocabulary words". A citing paper gives 18 participants. **high** on the 50-word figure (ACM abstract); **medium** on N.
- **Dearman & Truong (2012)**, CHI 2012, "Vocabulary Wallpaper": passive exposure on a phone home screen increased recognition and recall, and "the rate of vocabulary acquisition was significantly greater when presented with a contextually relevant vocabulary than a contextually-independent vocabulary". **high** (abstract)
- **Cai et al. (2015)**, "Wait-Learning", CHI 2015 (WaitChatter). 20 participants, two weeks, flashcards shown while waiting for chat replies: average 57 new words recalled (~4 per day); the lightest user (55 chats/day) learned 17. **high**
- **Labutov & Lipson (2014)**, "Generating code-switched text for lexical learning", ACL 2014, 562–571. 162 Mechanical Turk readers, artificial-language words substituted into a short story; recall measured by picking sentences that used the words correctly. ANOVA F = 11.38, p < .001. Manual selection (MAN) beat all automated methods; the optimisation model (OPT) beat RANDOM (p = .006) and roughly tied high-frequency selection (HF); OPT beat HF only for words appearing fewer than 4 times (p = .043). Key lesson: *which* words you swap, and *in which contexts*, matters more than the mere act of swapping. **high**
- **Renduchintala, Knowles, Koehn & Eisner (2016)**, ACL 2016. 79 Turkers guessed German words embedded in English sentences; a model of guessability from cognate distance, context informativeness (PMI) and prior exposure predicted which words readers could understand. **high** (abstract + text)
- **Renduchintala, Koehn & Eisner (2019)**, EMNLP 2019, "Spelling-aware construction of macaronic texts". 39 absolute beginners read machine-chosen macaronic versions of Austen (Spanish) or Kafka (German). Guess quality for swapped tokens, Spanish: random .74 (closed-class) / .61 (open-class); spelling-aware model .82 / .80. German: random .59 / .38; model .80–.82 / .78–.79. Retention experiment (60 participants, 25 sentences, no study): readers correctly translated more than 30 of 71 new word types afterwards, more than half with partial credit. **high**

### LLM-era (2023–2026)

- I found **no peer-reviewed learner-outcome study** of LLM-generated code-switched or macaronic reading. The hits are about training LLMs with code-switching curricula (Yoo et al., arXiv 2411.02460, Findings of ACL 2025; "Feeding BabyLMs Macaroni", arXiv 2609.30535), generating realistic code-switched text (EZSwitch, arXiv 2410.22660; arXiv 2502.12924), LLM robustness to code-switched input (arXiv 2506.14012), a survey (arXiv 2602.11181), and a 2025 study of learners' own code-switching in LLM speaking practice (arXiv 2512.23136). **high** that these exist; **high** that none measures vocabulary gains in humans.
- **Toucan** (commercial Chrome extension; >300,000 installs; wound down and acquired by Babbel in 2023 per TechCrunch) has no published efficacy study that I could find. **medium**

Takeaway: the method has face validity, consistent small positive results, and one strong null-difference result against drill (Christensen 2007). The best-controlled work (Labutov; Renduchintala) is on *selection*, and it shows selection quality drives recall. **medium**

---

## 4. Which words survive being swapped in isolation

- **Part of speech**: Ellis & Beaton (1993), *Language Learning* 43(4), 559–617. 47 learners of German. Part of speech correlated with learnability r = .44–.64 and imageability r = .37–.53; nouns recalled at .68 vs verbs .53 (productive). Native-to-foreign learning was easier when the FL word matched L1 phonology (r = .40–.63) and orthography (r = .28–.45). The noun advantage may be an imageability effect; a later child study that controlled imageability found no noun advantage. **high** on the numbers; **medium** on the interpretation.
- **Concreteness and cognates**: de Groot & Keijzer (2000), *Language Learning* 50(1), 1–56. Paired associates (Dutch–pseudoword), 60 pairs, six presentations, retest one week later. "Cognates and concrete words were easier to learn and less susceptible to forgetting than noncognates and abstract words. Word frequency hardly affected performance." **high**. Lotto & de Groot (1998), *Language Learning* 48(1), 31–69: 56 Dutch adults, 80 Italian words; word-translation learning beat picture learning; cognates and high-frequency words easier. **high**
- **Function words**: I found **no study that swaps function words in L1 text and measures learning**. Indirect evidence: (a) function words are short and unstressed and hard to perceive in speech (review of L2 morphology, EuroSLA journal) — not a reading finding; (b) in Renduchintala et al. (2019) swapped closed-class tokens were *guessed* in context about as well as open-class ones (.72–.82 vs .70–.80 for Spanish), but guessability is not retention; (c) Burling (1968, 1978) deliberately started with articles and grammatical markers because they carry structure, not meaning. **medium** that the question is open.
- **Articles and gender**: Arnon & Ramscar (2012), *Cognition* 122(3), 292–305. Adults learning an artificial language learned grammatical gender *worse* when they first learned bare nouns and later the article–noun sequences; learning the larger unit first was better. Order of acquisition changes what gets learned. **medium** (abstract via search; full text paywalled). A review of L2 gender teaching reports that presenting determiner–noun pairs facilitates gender learning. **low**. Implication: swapping bare nouns into English (which has no gender) may build form–meaning links while leaving gender unlearned or mis-learned.
- **Cognate facilitation at the interface level**: Renduchintala et al. (2016, 2019) model and exploit cognate distance as a predictor of in-context comprehension; their spelling-aware model raised guess quality from .61 to .80 (Spanish open-class). **high**

Takeaway: concrete, imageable nouns with cognate or orthographic overlap are the safest swap targets. Verbs and abstract words are harder. Function words are untested as swap targets; articles swapped without their nouns are theoretically risky. **medium–high**

---

## 5. Retrieval before the gloss: pretesting, errorful generation, testing effect

- **Kornell, Hays & Bjork (2009)**, *JEP: LMC* 35(4), 989–998. Six experiments. Procedure in Exps 4–6: cue alone for 8 s (guess), then cue + answer for 5 s; read-only shows the pair for 13 s. Weak-associate pairs (e.g., whale → mammal): final cued recall for the test condition vs read-only: Exp 3 .71 vs .50 (d = 1.49); Exp 4 .67 vs .55 (d = 0.38); Exp 5 (38-hour delay) .47 vs .35 (d = 0.94); Exp 6 (between-subjects) .69 vs .60 (d = 0.44). Unsuccessful retrieval attempts with feedback enhance learning. **high**
- **Hays, Kornell & Bjork (2013)**, *JEP: LMC* 39(1), 290–296. The failed-test benefit appeared with **immediate** feedback and disappeared with **delayed** feedback (except when test direction was reversed). **high** (abstract). Mera et al. (2025, *Journal of Cognition*) likewise found immediate feedback more effective, though some pretesting effect survived delays. **medium**
- **Grimaldi & Karpicke (2012)**, *Memory & Cognition* 40, 505–513. Pretesting helped only when cue and target were semantically related. **medium** (via Potts & Shanks 2014's discussion)
- **Potts & Shanks (2014)**, *JEP: General* 143(2), 644–667. Four experiments with rare English words and **Euskara–English translation pairs** (Exp 2B, 24 participants, 60 nouns, correct guesses 0.2%). Generate-then-feedback beat reading: Exp 1 d = .47 (all items), .56 (error items only); Exp 2B d = .28; Read and Choice did not differ. Participants judged generation *less* effective than reading, the reverse of the truth. Study-trial timing: target displayed 17 s in Read trials. **high**
- **Seabrooke et al. (2021)**, *Memory & Cognition* 49, 1095–1115, "You won't guess that". Finnish–Polish pairs; guess within **8 s** then answer for 5 s, vs read for 13 s. Recognition: guess .92 vs read .86 (benefit replicated). **Cued recall: reading .48 vs guessing .40** (F(1,57) = 20.54, p < .001); restudy raised recall (.63 vs .25) but did not rescue guessing. Across Exps 1–3 guessing never beat reading on cued recall of foreign vocabulary; the benefit reappeared only for weakly associated L1 word pairs (Exp 4). Conclusion: "undermining the usefulness of the learning-through-guessing strategy for acquiring foreign language vocabulary." **high**
- **Testing effect proper** (retrieval of a word you have already met): Karpicke & Roediger (2008), *Science* 319, 966–968. Swahili–English pairs; repeated retrieval ~80% recall at one week vs ~35% for repeated study of already-recalled items. **medium** (secondary). Yang, Luo, Vadillo, Yu & Shanks (2021), *Psychological Bulletin* 147(4), 399–435: classroom testing g ≈ 0.50 across 222 studies. **medium**
- **Optimal delay**: no study varies the guess window below a few seconds. The lab paradigms use 8 s guess windows (Kornell 2009; Seabrooke 2021) with feedback immediately after. Vaughn & Rawson (2012) found one incorrect guess trial as good as three. The 700 ms figure has no direct empirical basis; what the literature supports is (a) a retrieval *attempt* before the answer, and (b) feedback that arrives immediately after the attempt. **high** that 700 ms is unstudied.

Takeaway: for a word the reader has **already met**, a pause-then-reveal is a retrieval-practice trial and should help (testing effect, Kornell/Hays). For a word the reader has **never seen**, forcing a guess at a non-cognate foreign form yields recognition gains but no cued-recall gain over simply showing the gloss (Seabrooke 2021 vs Potts & Shanks 2014; the two disagree, and Seabrooke's larger, pre-registered-style series is the more cautious reading). **medium–high**

---

## 6. Spacing and intake rate

- **Cepeda, Vul, Rohrer, Wixted & Pashler (2008)**, *Psychological Science* 19(11), 1095–1102. 1,354 participants, two study sessions, retention intervals (RI) of 7, 35, 70 and 350 days. Optimal gaps (tested values) for recall: 1, 11, 21, 21 days; spline-interpolated optima ≈ 3, 8, 12, 27 days = 43%, 23%, 17%, 8% of the RI. Recall improvement for the optimal gap vs a zero-day gap: 10%, 59%, 111%, 77% (overall 64% increase, d = 1.1). The optimal gap grows with RI while the gap/RI ratio shrinks; a short gap followed by a long test delay is the worst case. **high**
- **Bahrick, Bahrick, Bahrick & Bahrick (1993)**, *Psychological Science* 4(5), 316–321. Four subjects, 300 foreign-language word pairs, nine years. 13 relearning sessions at 56-day intervals produced retention (at 1–5 years) comparable to 26 sessions at 14-day intervals. **medium** (secondary summaries agree)
- **Kim & Webb (2022)**, *Language Learning* 72(1), 269–319. Meta-analysis, 48 experiments, 98 effect sizes, N = 3,411. Spacing had a medium-to-large effect; shorter spacing equalled longer on immediate tests but was worse on delayed tests; **equal and expanding schedules were statistically equivalent**; feedback timing moderated the effect (immediate feedback g = 1.04, secondary). **high** (abstract); **medium** on the g = 1.04.
- **Kang (2016)**, *Policy Insights from the Behavioral and Brain Sciences* 3(1), 12–19. Review: spacing beats massing across memory, problem solving and transfer; adding retrieval tests amplifies the benefit. **medium** (abstract)
- Incidental-reading corroboration: Webb et al. (2023) spaced g = 1.71 vs massed 0.58 on delayed tests; Nakata & Elgort (2021) spaced > massed for explicit knowledge. **high**

Implication for reappearance: if the goal is to still know a word a month later, the first re-encounter should land within roughly 1–3 days and later ones about a week apart; for year-long retention, gaps of 3–4 weeks are near optimal (Cepeda 2008). Whether gaps expand or stay equal does not matter much (Kim & Webb 2022).

### New words per day

- No peer-reviewed study establishes a sustainable new-word intake rate for passive or spaced learning. **unverified**
- Reference points: Nation (2014) uses 1,000 families/year (~3/day) as an *optimistic* L2 goal with no EFL evidence behind it. Milton & Meara (1995), *ITL* 107–108: 53 study-abroad students gained at a rate approaching 2,500 words/year (~7/day) in immersion. **medium**. Brysbaert et al. (2016): L1 adults add ~1 lemma per 2 days. **high**. WaitChatter: ~4 words/day over two weeks (Cai et al. 2015). **high**. ALOE: ~50 words over two months (~0.8/day) with no explicit study (Trusty & Truong 2011). **high**.
- Duolingo's half-life regression (Settles & Meeder 2016, ACL): fitted on 12.9 million practice events; cut recall-prediction error by 45%+ and raised daily engagement by 12% *relative to their own earlier model*. It is a scheduling model, not an intake-rate study. **high**. FSRS/Anki figures on workload are community benchmarks, not peer-reviewed. **low**
- french-weave's own policy (≤5 new/day, ≤20 in "learning") is a design choice without a cited source. **high** that it is uncited.

---

## 7. Frequency first vs relevance; interest and adherence

- **The frequency argument is a coverage argument.** Nation (2001) Table 1.4: 100 words = 49% of tokens, 1,000 = 74%, 2,000 = 81%, 3,000 = 85%, 5,000 = 89%. Returns diminish sharply after 2,000–3,000. Schmitt & Schmitt (2014), *Language Teaching* 47(4), 484–503, therefore redraw the bands: high-frequency = first 3,000 families; mid-frequency = 3,001–9,000; these mid-frequency words are what a reader still needs for 98% coverage. **high**
- **Topic vocabulary is not negligible.** Chung & Nation (2003), *Reading in a Foreign Language* 15(2): technical words were one in every three running words in an anatomy text and one in five in an applied-linguistics text; many were drawn from the first 2,000 and the AWL. So "relevance" overlaps with frequency *within a domain*. **high**
- **Narrow reading** (same topic repeatedly) raises repetition of the same words. Kang (2015), *RELC Journal* 46(2), 165–179: 61 high-intermediate learners, one month, thematically related vs unrelated texts; narrow reading "considerably facilitated" meaning knowledge and use. **high** (abstract). Chang & Renandya (2021) found no difference. **medium**. Net: mixed but leaning positive.
- **Interest**: Cancino (2023), *Lingua*, "Topic interest increases L2 incidental vocabulary learning and effective dictionary look-up behaviour": 96 adult EFL learners read high- vs low-interest expository texts with dictionary access; more words learned and retained from the interesting text, with more look-ups among the learned words. A second Cancino study (55 learners, *RESLA*) found the same, mediated by look-up behaviour. Both are single-session experiments. **medium**
- **Contextual relevance of the vocabulary itself**: Dearman & Truong (2012) found significantly faster acquisition for contextually relevant words than context-independent words on a phone wallpaper. **high**
- **Extensive reading outcomes**: Nakanishi (2015), *TESOL Quarterly* 49(1): 34 studies, N = 3,942; group contrast d = 0.46, pre–post d = 0.71 (all proficiencies pooled). Jeon & Day (2016), *Reading in a Foreign Language* 28(2): 49 studies, 71 samples, N = 5,919 (vocabulary-specific effect not retrieved). **medium**. I found no study that measures *adherence* (continuing to read) as a mediator; the Ferriss "read what you'd read anyway" claim is about adherence, and the literature supports it only indirectly through interest and relevance effects. **unverified** on adherence.
- Ferriss's own post defers to interest after the "most common 300–500 words", which is roughly consistent with the coverage math; his "95% in 3 months, 98% in 10 years" line is unsourced. **high** that it is unsourced.

Takeaway: frequency ordering is right for the first ~2,000–3,000 families because of coverage, and wrong as a sole criterion after that, where domain and interest decide which mid-frequency words a reader will actually meet 10+ times. **high**

---

## 8. Ferriss's sources: the Fry lineage

- Ferriss (2009) gives no source. His written-English list, in order, is: *the, of, and, a, to, in, is, you, that, it, he, was, for, on, are, as, with, his, they, I, at, be, this, have, from, or, one, had, by, word, but, not, what, all, were, we, when, your, can, said, there, use, an, each, which, she, do, how, their, if, will, up, other, about, out, many, then, them, these, so, some, her, would, make, like, him, into, time, has, look, two, more, write, go, see, number, no, way, could, people, my, than, first, water, been, call, who, oil, its, now, find, long, down, day, did, get, come, made, may, part.* **high**
- **Fry (1980)**, "The new instant word list", *The Reading Teacher* 34(3), 284–289, revised his 1957 list "based on a more recent word frequency count", namely *The American Heritage Word Frequency Book* (Carroll, Davies & Richman, 1971; ~5 million running words, ~87,000 types, from US school materials for grades 3–9). Fry wrote that about half of all written English is composed of the first 100 Instant Words and their inflected variants, that the first 10 make up about 25% of words in print, and that the 300 make up about 66%. (Readsters 2013 summary of Fry 1980; Readsters Table 5 reproduces the Fry 300 in frequency order.) **high**
- Fry's ordered list positions 1–28 (*the, of, and, a, to, in, is, you, that, it, he, was, for, on, are, as, with, his, they, I, at, be, this, have, from, or, one, had*) and 51–78 (*will, up, other, about, out, many, then, them, these, so, some, her, would, make, like, him, into, time, has, look, two, more, write, go, see, number, no, way*) match Ferriss's list **word for word in the same order**. The oddities *word*, *water*, *oil* are Fry artefacts of a 1969 school-text corpus. Some reproductions (sightwords.com) swap *oil/call/word* for *am/called/words*; Ferriss used the original. **high**
- The 49% figure for 100 words also appears independently in Nation (2001) Table 1.4, computed from the same Carroll et al. corpus. Modern corpora give similar magnitudes: first 1,000 BNC families + proper nouns = 78–81% of written text (Nation 2006); first 1,000 Brown lemmas = 72% (Nation & Waring 1997). **high**
- Correction to Ferriss: the "first 25 words = 1/3" and "300 = 65%" figures are Fry's (Fry says 10 words ≈ 25%, 300 ≈ 66%). They are token coverage of 1969 American school texts, not of "the language", and nearly all of the top 100 are function words, which is exactly the class a word-swap can least safely teach (section 4). **high**

---

## Design implications for a word-swap extension

1. Keep swap density low enough that page coverage stays at or above ~95%, i.e., no more than about 1 swapped word in 20 running words, and nearer 1 in 50 for comfort (Hu & Nation 2000 via Schmitt et al. 2011; Laufer & Ravenhorst-Kalovski 2010; Nation 2006).
2. Treat coverage as a dial, not a cliff: comprehension drops roughly linearly from 100% to 90% and collapses below 90% (Schmitt et al. 2011; Kremmel et al. 2023).
3. Engineer repetition. Target 8–12 encounters per learning word before promotion; fewer than 8 encounters left no recallable meaning at 3 months (Waring & Takaki 2003; Webb 2007; Nation 2014).
4. Count encounters per word, not per day. Ordinary reading gives most words 1–3 encounters; the extension's advantage is that it can guarantee 10+ (Nation 2014 token tables).
5. Expect recognition before recall. After 10+ encounters expect ~84% meaning recognition but ~55% meaning recall; design "known" criteria around recognition first, recall later (Pellicer-Sánchez & Schmitt 2010; Webb et al. 2023 test-type rates).
6. Space the encounters of each learning word across pages and days rather than clustering them on one page; spaced encounters roughly tripled delayed-test effect size versus massed (Webb et al. 2023; Nakata & Elgort 2021).
7. Schedule re-encounters at about 1–3 days, then about a week, then 3–4 weeks; equal and expanding gaps work equally well (Cepeda et al. 2008; Kim & Webb 2022).
8. Show the gloss immediately after the retrieval attempt; delayed feedback erases the pretesting benefit (Hays, Kornell & Bjork 2013).
9. For a word already seen before, the hover pause is a retrieval trial and is justified by the testing effect (Kornell, Hays & Bjork 2009; Karpicke & Roediger 2008).
10. For a brand-new, non-cognate word, do not rely on guessing: show the L1 gloss on first encounter and start the pause-then-reveal from the second encounter (Seabrooke et al. 2021; Potts & Shanks 2014 disagree, so this is a conservative choice).
11. Use L1 glosses, not L2 definitions; L1 glosses produced more learning in the glossing meta-regression (Yanagisawa, Webb & Uchihara 2020).
12. Consider a two-option "which meaning?" gloss on later encounters; multiple-choice glosses were the most effective gloss type (Yanagisawa et al. 2020).
13. Prefer concrete, imageable nouns, then verbs, then abstract words; nouns were recalled at .68 vs verbs .53 and concrete words resisted forgetting (Ellis & Beaton 1993; de Groot & Keijzer 2000).
14. Prefer cognates and orthographically similar words early; they are learned faster, forgotten less, and guessed in context more accurately (de Groot & Keijzer 2000; Lotto & de Groot 1998; Renduchintala et al. 2019).
15. Do not swap bare function words (the, of, is) as learning targets. The top-100 list is mostly function words, no study shows they are learned from isolated swaps, and Burling taught them as grammar in sentence frames, not as vocabulary (Burling 1968, 1978; Nation 2001; Schmitt et al. 2011).
16. Swap nouns together with their article when the target language has gender; learning bare nouns first impaired later gender learning in adults (Arnon & Ramscar 2012).
17. Choose swap sites by context informativeness, not only by word frequency; manually chosen informative contexts beat frequency-only selection, and a context model beat random (Labutov & Lipson 2014; Renduchintala et al. 2016, 2019).
18. Order the lexicon by frequency only up to roughly the first 2,000–3,000 families, then weight by the reader's actual pages (domain and interest), because mid-frequency words only recur inside a topic (Schmitt & Schmitt 2014; Chung & Nation 2003; Kang 2015; Dearman & Truong 2012).
19. Calibrate the daily intake against observed data, not folklore: comparable passive systems produced ~0.8 words/day (ALOE, 2 months) to ~4 words/day (WaitChatter, 2 weeks); french-weave's 5/day cap sits at the upper end (Trusty & Truong 2011; Cai et al. 2015).
20. Expect a meaningful share of what is "learned" to be lost: form recognition fell from 18% to 6% of targets between immediate and delayed tests in the meta-analysis, so re-expose "known" words occasionally (Webb et al. 2023; Waring & Takaki 2003).

---

## Open questions / unverified

- **Hover delay**: no study tests retrieval windows under a few seconds; the 700 ms value is a UX guess. The literature supports "attempt, then immediate feedback", not a specific latency.
- **Pretesting for brand-new foreign words**: Potts & Shanks (2014) found a recall benefit; Seabrooke et al. (2021) found none and a cost on cued recall. Not resolved.
- **Function words as swap targets**: no direct study found. Renduchintala et al. (2019) shows they are *guessable* in context; retention is unmeasured.
- **Articles and gender**: Arnon & Ramscar (2012) is an artificial-language study; no diglot-specific test exists. The abstract was read only via search summaries (publisher page returned 403).
- **LLM-generated code-switched reading**: no human learning-outcome study located for 2023–2026.
- **Sustainable new-words-per-day**: no peer-reviewed estimate. Anki/FSRS workload figures are community benchmarks.
- **Adherence** ("read what you would read anyway"): no study measures it as a mediator; interest and relevance effects are the closest evidence.
- **Non-English coverage thresholds**: only a French lemma study (Cobb 2026) surfaced; nothing solid for Spanish, German or Italian.
- **Hu & Nation (2000) primary text**: the open PDF is a scan without a text layer; its per-condition numbers are quoted from Schmitt et al. (2011) and Kremmel et al. (2023).
- **Textual enhancement effect size** (g = 0.54): authorship of the 2025 meta-analysis not verified.
- **Uchihara et al. (2019) r = .41 for reading**: secondary; the primary abstract gives only the overall r = .34.
- **Kim & Webb (2022) immediate-feedback g = 1.04**: secondary.
- **Karpicke & Roediger (2008) 80% vs ~35%**: from textbook summaries, not the paper's table.
- **Ji Yuhua sandwich stories**: description verified (Ji 1999); no effect data found.
- Several Wiley, ScienceDirect, ACM and Springer pages returned 403; abstracts for those came from Semantic Scholar, OpenAlex, ERIC or the authors' open PDFs.

---

## References (primary sources read or abstract-verified)

- Arnon, I., & Ramscar, M. (2012). Granularity and the acquisition of grammatical gender. *Cognition*, 122(3), 292–305. https://doi.org/10.1016/j.cognition.2011.10.009
- Bahrick, H. P., et al. (1993). Maintenance of foreign language vocabulary and the spacing effect. *Psychological Science*, 4(5), 316–321.
- Brysbaert, M., et al. (2016). How many words do we know? *Frontiers in Psychology*, 7, 1116.
- Burling, R. (1968). Some outlandish proposals for the teaching of foreign languages. *Language Learning*, 18, 61–75.
- Burling, R. (1978). An introductory course in reading French. *Language Learning*, 28(1), 105–128. https://doi.org/10.1111/j.1467-1770.1978.tb00308.x
- Cai, C. J., et al. (2015). Wait-Learning: Leveraging wait time for second language education. *CHI 2015*. https://sls.csail.mit.edu/publications/2015/Cai_CHI-2015.pdf
- Cancino, M. (2023). Topic interest increases L2 incidental vocabulary learning and effective dictionary look-up behaviour. *Lingua* (ScienceDirect S0023969023000516).
- Cepeda, N. J., et al. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science*, 19(11), 1095–1102. http://www.yorku.ca/ncepeda/publications/CVRWP2008.pdf
- Christensen, E., Merrill, P., & Yanchar, S. (2007). Second language vocabulary acquisition using a diglot reader or a computer-based drill and practice program. *CALL*, 20(1), 67–77. ERIC EJ764047.
- Chung, T. M., & Nation, P. (2003). Technical vocabulary in specialised texts. *Reading in a Foreign Language*, 15(2).
- Dearman, D., & Truong, K. (2012). Evaluating the implicit acquisition of second language vocabulary using a live wallpaper. *CHI 2012*. https://doi.org/10.1145/2207676.2208598
- de Groot, A. M. B., & Keijzer, R. (2000). What is hard to learn is easy to forget. *Language Learning*, 50(1), 1–56.
- Ellis, N. C., & Beaton, A. (1993). Psycholinguistic determinants of foreign language vocabulary learning. *Language Learning*, 43(4), 559–617.
- Ferriss, T. (2009). How to learn (but not master) any language in 1 hour. https://tim.blog/2009/01/20/learning-language/
- Fry, E. (1980). The new instant word list. *The Reading Teacher*, 34(3), 284–289. ERIC EJ236457. Readsters (2013) comparison: https://www.readsters.com/wp-content/uploads/2013/03/ComparingDolchAndFryLists.pdf
- Hays, M. J., Kornell, N., & Bjork, R. A. (2013). When and why a failed test potentiates the effectiveness of subsequent study. *JEP: LMC*, 39(1), 290–296. https://doi.org/10.1037/a0028468
- Hu, M., & Nation, P. (2000). Unknown vocabulary density and reading comprehension. *Reading in a Foreign Language*, 13(1), 403–430.
- Ji, Y. (1999). Communicative language-teaching through sandwich stories for EFL children in China. *TESL Canada Journal*, 17(1). ERIC EJ597414.
- Kang, E. Y. (2015). Promoting L2 vocabulary learning through narrow reading. *RELC Journal*, 46(2), 165–179.
- Kang, S. H. K. (2016). Spaced repetition promotes efficient and effective learning. *Policy Insights from the Behavioral and Brain Sciences*, 3(1), 12–19.
- Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. *Science*, 319, 966–968.
- Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. *Language Learning*, 72(1), 269–319.
- Kornell, N., Hays, M. J., & Bjork, R. A. (2009). Unsuccessful retrieval attempts enhance subsequent learning. *JEP: LMC*, 35(4), 989–998. https://web.williams.edu/Psychology/Faculty/Kornell/Publications/Kornell.Hays.Bjork.2009.pdf
- Kremmel, B., Indrarathne, B., Kormos, J., & Suzuki, S. (2023). Unknown vocabulary density and reading comprehension: Replicating Hu and Nation (2000). *Language Learning*, 73(4), 1127–1163. https://doi.org/10.1111/lang.12622
- Labutov, I., & Lipson, H. (2014). Generating code-switched text for lexical learning. *ACL 2014*, 562–571. https://aclanthology.org/P14-1053.pdf
- Laufer, B., & Ravenhorst-Kalovski, G. C. (2010). Lexical threshold revisited. *Reading in a Foreign Language*, 22(1), 15–30. https://files.eric.ed.gov/fulltext/EJ887873.pdf
- Lotto, L., & de Groot, A. M. B. (1998). Effects of learning method and word type on acquiring vocabulary in an unfamiliar language. *Language Learning*, 48(1), 31–69.
- Milton, J., & Meara, P. (1995). How periods abroad affect vocabulary growth in a foreign language. *ITL*, 107–108, 17–34.
- Nakanishi, T. (2015). A meta-analysis of extensive reading research. *TESOL Quarterly*, 49(1), 6–37.
- Nakata, T., & Elgort, I. (2021). Effects of spacing on contextual vocabulary learning. *Second Language Research*, 37(2), 233–260.
- Nation, I. S. P. (2001). *Learning vocabulary in another language*. Cambridge University Press. Sample chapter: https://catdir.loc.gov/catdir/samples/cam031/2001269892.pdf
- Nation, I. S. P. (2006). How large a vocabulary is needed for reading and listening? *Canadian Modern Language Review*, 63(1), 59–82. https://www.lextutor.ca/cover/papers/nation_2006.pdf
- Nation, I. S. P. (2014). How much input do you need to learn the most frequent 9,000 words? *Reading in a Foreign Language*, 26(2), 1–16. https://files.eric.ed.gov/fulltext/EJ1044345.pdf
- Nation, P., & Waring, R. (1997). Vocabulary size, text coverage and word lists. https://www.lextutor.ca/research/nation_waring_97.html
- Nemati, A., & Maleki, E. (2013). The effect of teaching vocabulary through the diglot-weave technique and attitude towards this technique. *Journal of American Science*, 9(1s). https://www.jofamericanscience.org/journals/am-sci/am0901s/001_14812am0901s_1_6.pdf
- Pellicer-Sánchez, A., & Schmitt, N. (2010). Incidental vocabulary acquisition from an authentic novel. *Reading in a Foreign Language*, 22(1), 31–55. https://files.eric.ed.gov/fulltext/EJ887875.pdf
- Potts, R., & Shanks, D. R. (2014). The benefit of generating errors during learning. *JEP: General*, 143(2), 644–667. https://discovery.ucl.ac.uk/id/eprint/1399515/
- Renduchintala, A., Knowles, R., Koehn, P., & Eisner, J. (2016). User modeling in language learning with macaronic texts. *ACL 2016*. https://aclanthology.org/P16-1175.pdf
- Renduchintala, A., Koehn, P., & Eisner, J. (2019). Spelling-aware construction of macaronic texts for teaching foreign-language vocabulary. *EMNLP-IJCNLP 2019*. https://aclanthology.org/D19-1679.pdf
- Schmitt, N., Jiang, X., & Grabe, W. (2011). The percentage of words known in a text and reading comprehension. *Modern Language Journal*, 95(1), 26–43. https://www.lextutor.ca/cover/papers/schmitt_etal_2011.pdf
- Schmitt, N., & Schmitt, D. (2014). A reassessment of frequency and vocabulary size in L2 vocabulary teaching. *Language Teaching*, 47(4), 484–503.
- Seabrooke, T., et al. (2021). You won't guess that: On the limited benefits of guessing when learning a foreign language. *Memory & Cognition*, 49, 1095–1115. https://d-nb.info/1252316607/34
- Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. *ACL 2016*. https://research.duolingo.com/papers/settles.acl16.pdf
- Trusty, A., & Truong, K. N. (2011). Augmenting the web for second language vocabulary learning. *CHI 2011*. https://doi.org/10.1145/1978942.1979414
- Uchihara, T., Webb, S., & Yanagisawa, A. (2019). The effects of repetition on incidental vocabulary learning: A meta-analysis of correlational studies. *Language Learning*, 69(3), 559–599.
- Waring, R., & Takaki, M. (2003). At what rate do learners learn and retain new vocabulary from reading a graded reader? *Reading in a Foreign Language*, 15(2), 130–163. https://www.wgtn.ac.nz/__data/assets/pdf_file/0008/1626146/Waring-Takaki-2003.pdf
- Webb, S. (2007). The effects of repetition on vocabulary knowledge. *Applied Linguistics*, 28(1), 46–65.
- Webb, S., Uchihara, T., & Yanagisawa, A. (2023). How effective is second language incidental vocabulary learning? A meta-analysis. *Language Teaching*, 56(2), 161–180. https://doi.org/10.1017/S0261444822000507
- Yanagisawa, A., Webb, S., & Uchihara, T. (2020). How do different forms of glossing contribute to L2 vocabulary learning from reading? *Studies in Second Language Acquisition*, 42(2), 411–438. ERIC EJ1251024.
- Yang, C., et al. (2021). Testing (quizzing) boosts classroom learning: A systematic and meta-analytic review. *Psychological Bulletin*, 147(4), 399–435.
