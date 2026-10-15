# Language Weave: product landscape

Research date: 2026-10-15 (America/New_York). All store counts and dates were read on that day unless noted.
Scope: browser extensions that swap words (or sentences) on ordinary web pages into a target language. Click-to-translate readers are included only where they shape expectations.

Method notes. Chrome Web Store pages render client-side. Several listings returned "This item is not available" or an empty shell. Those are marked as such; they are not inferred to be dead unless other evidence agrees. Reddit could not be fetched or surfaced through search; no Reddit quotes appear below. Hacker News, Chrome Web Store, Firefox Add-ons (API), Trustpilot, Product Hunt mirrors, GitHub, and vendor sites were used.

## 1. Comparison table

| Product | Status (2026-10) | Languages | How words are chosen | Density control | Hover / click | Grammar adjusted | Progression | Price | Where page text goes |
|---|---|---|---|---|---|---|---|---|---|
| Toucan by Babbel | Live. Chrome v2.19.8, 2025-07-15, 200K users, 3.5/5 (1.4K). Edge v2.18.11 from 2023. Firefox gone. | 12 targets: EN, ES, FR, JA, DE, KO, PT, IT, AR, ZH, HE, HI | Curated "language packs" (sets of English words it looks for), human-translated, NLP for context; "progressively larger lexical chunks" | Less / Many / More plus a level setting | Hovercard: English, definition, audio, save, mark learnt | No evidence; reviewers show naive swaps ("He nunca looked espalda") | Mark as learnt; claims spaced repetition; quizzes/games | Free (paid tier folded in after Babbel) | Toucan/Babbel servers; store discloses PII, activity, website content |
| Fluent (Montréal) | Listing will not load; reviews page says "not available"; usefluent.app DNS dead. Likely delisted. | ES, FR, IT (+ DE, PT, EN per PH) | User hovers a word to pick it; Fluent repeats it until learnt; mostly adjectives/adverbs per one reviewer | Density setting | Hover shows original and triggers a quiz; confetti on completion | No evidence | Per-word progress, SRS, streaks | Free; ad-free Pro planned (2021) | Vendor servers (undocumented) |
| MindTheWord | Dead. Last code and store update 2018-10-07. MV2. Listing will not load. 3.09/5 (174) | ~100 via Google/Yandex/Bing MT | Random: shuffle page words, keep `percentage` (default 15%), n-gram 1..n, min length, blacklist, user dictionary | 1-100% | Shows original; TTS via ResponsiveVoice | None (word-for-word MT) | Learnt list; quiz; no SRS | Free, BYO MT keys | Google/Yandex/Bing Translate |
| LoomVue | Dead/unlisted. v1.0.4, May 2021. Store "not available". | EN->ES, ES->EN | NMT plus word alignment, sentence context; self-described "diglot weave" | Adjustable pacing | Audio, save words | Alignment implies sentence-level sense | Save for later | Paid | Vendor servers |
| Weeve (Dublin) | Dormant. Store "not available"; weeve.ie TLS failure; no Trustpilot reviews in 12 months. Last known 4.8/5 (24), ~1K users | FR, ES (SV, PT, HI promised) | "Proprietary AI built on LLMs"; first 3,000-4,000 frequency words; 150+ contractors built weave datasets | Unknown | Unknown | Reviewer reports his/her gender mix-ups in French | Premium review system | Free + 14-day trial; ~$4-8/mo | Vendor servers |
| illa-helper (open source) | Active. v1.8.2, 2026-07-02. 2.9K GitHub stars. 2K store users, 4.6/5 (7) | 20+ (whatever the LLM handles) | LLM picks words for one of 5 levels (i+1 claim), context-aware prompt per direction | 1-100% by characters; lazy per paragraph on scroll | Phonetics, AI definition, TTS (Youdao, Web Speech fallback), blur mode | None | None; Anki export requested | Free, BYO API (OpenAI-compatible, Gemini, Ollama) | User's chosen LLM endpoint |
| Slate: AI Language Immersion | New. v3.0.4, 2026-01-30, 5 users, no ratings | Not stated | Chrome built-in Gemini Nano reads the sentence to choose a fitting translation | Not stated | Not stated | Unknown | Points, streaks, levels | Free | On device (claims), yet discloses history/activity/content collection |
| Language Lens (Firefox, open source) | Stale. v1.0.10, 2025-02-10, 3 users | JA, ZH, KO, ES, FR, DE, PL, CY, LA | Sentences containing a known word go to the LLM; new words added from knowledge | None stated | Original sentence, word list, audio; kanji toggle with ruby furigana | Unknown | Familiarity tracking, "spaced repetition" claim | Free, BYO key (OpenAI, Anthropic, Gemini, OpenWebUI) | User's chosen LLM |
| LingoLayer | New. v1.0.0, 2026-03-23, 9 users. Reddit only | 10 (DE, ES, FR, JA, HI...) | LLM swaps phrases at CEFR A1-B2 | CEFR level | Original, gender/case/conjugation, phonetic guide, TTS (browser or ElevenLabs) | Shows grammar in tooltip | None stated | Free, BYO key or local Ollama/LM Studio | User's chosen LLM; no backend |
| Polyglotl | New. v1.1.1, 2026-07-17, 4 users | Not stated; logographic scripts supported | User picks starter words; extension finds them | Not stated | Reading, meaning, audio, example sentences, character breakdown | Unknown | Known words fade back to plain text | In-app purchases | Collects PII, payment, website content |
| Nuenki (sentence-level) | Active. Firefox v2.0.0, 2026-07-21, 33 users, 4.4/5 (5) | 46 | Scores English sentences by CEFR word level (Bloom filters) plus grammar heuristics; translates ones near the user's level | More sentences as level rises | Hover shows English; click to keep; audio, Pinyin, Furigana | Whole sentence, so grammar is native | No automatic progression (2024) | $5.42/mo after 7-day trial | DeepL, Claude, GLM-4.7, Gemma 4 |
| Fluent Tab (Firefox) | Low activity. v1.0.6, 2025-08-02, 53 users | 11 incl. JA, KO, ZH | Unknown; "only selected words are sent for translation" | 1-30%; 3 levels | Hover shows English | None | None | Free, GPL-3.0 | Translation service (unnamed) |
| Progressive Immersion (open source) | Active. v0.10.2, 2026-09-16, 74 users | Google Translate languages | Frequent words | Unknown | Unknown | None | None | Free | Google Translate (listing calls this a privacy risk) |
| french-weave (reference) | Created 2026-10-14. MIT, 19 stars | FR only | Gemini (BYO key) picks from a 1,000-entry lexicon; learning words first; density per sentence; skips names, code, URLs | L1 ~1 per 1-2 sentences; L2 1-2 per sentence; cap per passage | Gloss after dwell = peek; click/Enter flip | Lexicon carries articles; no inflection | seen/peek/flip events; 3 exposure days to known; 20 active max; 5 new/day | Free, BYO Gemini key | Gemini API with user's key |

Products named in the brief but not found as swap tools: "Wordy", "Immersion", "Weave" (Weeve is the closest), Linguix (a writing assistant), Lingvist (no browser extension found), Readlang (click-to-translate; "does not swap words into the page"), Language Reactor (video subtitles). Lingua.ly (2013) and Google's Language Immersion for Chrome (2012) are dead.

## 2. Per-product notes

### Toucan by Babbel

Status. Babbel signed the acquisition in early September 2023 and announced it on 2023-09-19 ([Babbel press release](https://www.babbel.com/press/en-us/releases/keep-learning-while-browsing-babbel-to-integrate-toucan-browser-extension)). TechCrunch reported Toucan had already wound down as a company earlier in 2023, no staff joined Babbel, and paid features moved into the free tier ([TechCrunch, via search](https://techcrunch.com/?p=2602101)). jointoucan.com is live with a "© 2026 Babbel GmbH" footer. Chrome listing: v2.19.8, updated 2025-07-15, 200,000 users, 3.5/5 from 1.4K ratings ([Chrome Web Store](https://chromewebstore.google.com/detail/toucan-language-learning/lokjgaehpcnlmkebpmjiofccpklbmoci)). Edge listing: v2.18.11, last updated 2023-02-11, 4.1/5 from 190, 80,197 active installs (Edge add-ons API). Firefox: the AMO search API returns no result; Babbel's support article says "Toucan is currently only supported for Chrome and Edge browsers" ([Babbel support](https://support.babbel.com/hc/en-gb/articles/18269893246738-Toucan-browser-extension)).

Languages. 12 learning targets. The support article says it is "optimised for websites in English, Spanish, French, German, Italian, Portuguese, Hindi, and Korean."

Word selection. Three sources describe it:
- Hulry (2022): language packs are "a set of English words that Toucan looks for on a page and translates." Marking a word learnt stops future swaps. The team was then working on "recommendations", citing "coffee" inside "hot coffee" ([Hulry](https://hulry.com/toucan-learn-language/)).
- Toucan blog (2022): "Toucan translates progressively larger 'lexical chunks'" ([blog feed](https://blog.jointoucan.com/feed)).
- About page: translations by "a team of experts including foreign language professors and grad students"; "constantly improving the contextual accuracy of our translations" with NLP ([About](https://jointoucan.com/about)). TechCrunch 2020 adds that users "can also report words that are incorrectly translated."
- HN 2020, founder Shaun Merritt: topic packs; a marketing learner who meets "CPC" gets it highlighted with context on hover ([HN 23078725](https://news.ycombinator.com/item?id=23078725)).

Density. "Less", "Many", "More". "Less" gave 5-7 swaps in a 4-5 minute article (Hulry). Level is adjustable in settings (Babbel support). The highest density and games were paid in 2021 ([Substack](https://naturallyprocessed.substack.com/p/escaping-duolingoland)).

Hover and click. Hovercard shows the English word, usually a definition, a checkmark to mark learnt, a save icon, and audio (Hulry; [ghacks](https://www.ghacks.net/?p=179499)). Non-Latin scripts: "choose the alphabet shown for languages with unique scripts" (Babbel support; options not listed).

Grammar. No adjustment is documented. Evidence points to naive noun swaps. See complaints.

Progression. Mark as learnt; "skips words the user has already marked as known" (WaniKani forum). About page claims "spaced repetition and collocations" and that the approach is "just as (and sometimes more) effective as flash cards," with no citation.

Privacy. Store disclosure: PII, user activity, website content. HN 2020: q3k said the extension "at least tracks and sends off any tab hostname (or URL?) you've visited"; slg noted the site whitelist "includes numerous financial and banking sites, porn sites, and e-commerce sites"; the founder admitted the list was the top 500 sites "without any filter (which there definitely should have been)". The Edge manifest CSP allows Segment, Sentry, Amplitude, Lightstep, and Optimizely.

Top complaints.
1. Wrong sense and out-of-context swaps. Chrome review, 2026-10-08: "translating words out of context so the translation makes no sense." Edge reviewer: "He never looked back" became "He nunca looked espalda" (via search snippet of the Edge listing). Firefox reviewer (French): it "simply translates words without contextualizing, which makes things rather funny." Substack 2021: "Toucan struggles to pick the right sense of a selected word in English before translating it"; "application" became "solicitud" in a Node.js tutorial; "run" became "corrida", "both the wrong word sense as well as the wrong part of speech"; "natural language processing" became "natural idioma processing".
2. Page breakage and bugs. Chrome review, 2026-10-08: "joining words together (removing spaces) when rewriting pages." Chrome review, 2026-01-21: "Doesn't show any popup on selecting words." Firefox summary: "frequent crashes/not functioning" ([firefox-stats via search](https://firefox-stats.com/d/toucan-language-learning)).
3. Account and trust. Chrome review, 2026-10-15: "it provides no way to deleting your account, so you have to contact support." Firefox reviews raised a security concern because "the company is winding down", plus spam and cancellation issues.
Also: distraction at "Many" ("a ton of words highlighted in the page fighting for my attention", Hulry); the 2021 ad model where brands "own" words was called "downright dystopian" (Substack).

Does well. Polished UI and pastel highlights that "draw the eye"; mascot-led quizzes; 12 languages including four non-Latin scripts; saved-word review; free.

### Fluent

Status. Chrome listing (id embghnbnaodclojpfejpklgombehfmeo) rendered an empty shell on 2026-10-15; its reviews page says "This item is not available." usefluent.app does not resolve. fluent.co now hosts an unrelated consultancy. Last known store rating 4.6/5 from 153 (search snippet). Treat as delisted; not confirmed by the vendor.

History. Montréal, founded 2020 by Gavin Dove, Olga Sanchís, Yaniv Silberman, Ara Ghougassian; 7,000 users and 2M words practised by May 2021 ([Daily Hive](https://dailyhive.com/calgary/fluent-language-chrome-extension)). Product Hunt: Fluent 1.0 on 2021-04-12 (#1 of the day); Fluent 2.0 added "AI pronunciation" ([Product Hunt](https://www.producthunt.com/products/fluent-2-0)).

Mechanics. Users pick words by hovering; Fluent "shows those words more often"; hover triggers a quiz; completed words turn green with confetti (Product Hunt). Store copy promised spaced repetition, quizzes, and streaks.

Complaints. Substack 2021: Fluent "sticks somewhat safely to adjectives and adverbs" and lacks "a clear way to gauge a user's level"; running it with Toucan made "some words disappear entirely." MakeUseOf: "pared back... you lose some functionality."

Does well. One-click off; hover-quiz loop; simplicity.

### MindTheWord

Status. Dead. GitHub (OiWorld/MindTheWord) last push 2018-10-07; 43 stars; 29 open issues; GSoC project under AOSSIE in 2015, 2016, 2019. Manifest v2, so it cannot remain on the store. The listing rendered empty on 2026-10-15. crx4chrome records v4.0.0, 2018-10-07, 3.09/5 from 174 ratings. Licence is ambiguous: GPL-3.0 and CC BY-NC-ND are both listed.

Mechanics (from source). `filter()` shuffles all page words, drops digits, punctuation, blacklist, and short words, then keeps `percentage` (default 15) of them. `ngramMin`/`ngramMax` set consecutive words or characters. Options include `minimumSourceWordLength`, a user dictionary, `userDefinedOnly`, `learntWords`, a quiz built from random translated words, and TTS via ResponsiveVoice. Backends: Google, Yandex, Bing with user keys.

Lessons. Pure random selection with word-for-word MT. No sense disambiguation. No progression beyond a learnt list.

### LoomVue

Status. Dead or unlisted. v1.0.4, last update May 2021, "unlisted" (ExtensionAuditor via search). Store returns "not available."

Mechanics. "Neural machine translation and alignment algorithms" with sentence context; EN<->ES only; audio; save words; adjustable pacing; paid. It is the only pre-LLM product that used alignment for sense.

### Weeve

Status. Dublin; founded 2020 by Evan McGloughlin and Cian McNally ([Silicon Republic via search](https://siliconrepublic.com/?p=995376)). Store listing "not available" on 2026-10-15; weeve.ie TLS handshake failed; Trustpilot 3.2/5 from 5 reviews, none in the last 12 months. Treat as dormant.

Mechanics. "Proprietary AI built on large language models." Focus on the first 3,000-4,000 words. The founders said "GPT-4 translation accuracy is a mere 50 percent, due to the lack of weave data online," so they hired 150+ contractors to build weave datasets ([Growing Season, 2023-09-13](https://growingseason.substack.com/p/weeve-is-building-a-bridge-across)). Premium unlocked the review system.

Complaints (Trustpilot). 4-star, March 2024: gender mix-ups ("his" and "her") in French, suspected AI generation. 1-star, June 2024: "Absolutely horrible to use, completely worthless experience." Oct 2023: "I had to submit my card details 3 times." Feb 2024: wants "known" and "learning" word lists.

### illa-helper (Immersive Language Learning Assistant)

Status. Active, open source (MIT). 2,914 stars, 160 forks, created 2025-06-15, pushed 2026-07-02, v1.8.2 ([GitHub](https://github.com/xiao-zaiyi/illa-helper)). Store: 2K users, 4.6/5 from 7 ([extscope](https://extscope.org/extension/ekeljkknchehakckhghhkbalnnmgnche)).

Mechanics. LLM reads each paragraph and picks words for one of five levels. Ratio 1-100% by characters. Lazy translation on scroll. Incremental DOM processing with the Range API. Seven styles, including a blur "learning mode." Tooltip: phonetics (Dictionary API), AI definition, TTS (Youdao primary, Web Speech API backup, UK/US). Multiple API profiles with load balancing. Ollama supported.

Complaints (issues and reviews, Chinese, paraphrased with short quotes).
- Density ignored: #104 "set 1% but clearly translates more"; #87, #70, #99 same; review: "翻译比例滑块似乎调整后没有效果，仍然大面积翻译" (slider has no effect, still translates large areas).
- Level ignored: #92 "选词的精准度上有点差" (word choice precision is poor); at B1 it translated "user" and "how"; #115 at upper-intermediate it translated "we", "are", "not", and the grading felt "过于潦草" (too sloppy).
- Config lost on update (#83; review "updates will delete the configurations").
- Mixed-language pages break (#115); only first lines translated (#95); zh->en became zh->pinyin (#85); AI too slow, asks for Google/Microsoft MT (#79).

Does well. Performance engineering (lazy, incremental, cached), styling, multi-provider, non-Latin targets.

### Slate: AI Language Immersion

v3.0.4, 2026-01-30, 5 users, no ratings ([Chrome Web Store](https://chromewebstore.google.com/detail/nkckkmiddidlnfhclmalojibnibigokd)). Uses Chrome's built-in Gemini Nano; "reads the surrounding sentence to choose a fitting translation." Points, streaks, levels. Claims text stays on device, yet the listing discloses web history, user activity, and website content collection. No hardware caveats on the listing.

### Language Lens (Firefox)

v1.0.10, 2025-02-10, 3 daily users, 0 ratings, MIT ([AMO API](https://addons.mozilla.org/api/v5/addons/addon/language-lens/); [GitHub](https://github.com/mruwnik/language-lens)). BYO key for OpenAI, Anthropic, Gemini, OpenWebUI. Only sentences containing a known word go to the LLM. New words are added "based on your knowledge." Hover shows the original sentence and translated word list, plus audio. Japanese words have a per-word kanji toggle; code renders `<ruby>` furigana. Daily and monthly token limits.

### LingoLayer

v1.0.0, 2026-03-23, 9 users; Reddit only ([ChromeBoard](https://chromeboard.com/extension/lingolayer-monnagfmknbolicehkbhlhlbeoalpmbc)). Swaps phrases at CEFR A1-B2. Tooltip shows the English, grammar (gender, case, conjugation), and a phonetic guide. Providers: Featherless, OpenAI, Anthropic, Gemini, local Ollama or LM Studio. TTS: browser speech synthesis free, ElevenLabs premium. Keys stay local; no backend.

### Polyglotl

NBITS PTE LTD, v1.1.1, 2026-07-17, 4 users, in-app purchases ([Chrome Web Store](https://chromewebstore.google.com/detail/polyglotl/fmgngkladnkgakadabolebbkgcoomhng)). User picks starter words. Hover shows reading, meaning, audio, example sentences, and a character breakdown for logographic scripts. "Words you know well fade back to plain text automatically." Collects PII, payment data, and website content.

### Nuenki (sentence-level, related)

Firefox v2.0.0, 2026-07-21, 33 users, 4.4/5 from 5; Chrome too. $5.42/month after a 7-day trial. 46 languages ([nuenki.app](https://nuenki.app/)). Translates whole sentences near the user's level. Difficulty is scored on the English side with Bloom-filter CEFR word levels plus grammar heuristics, in Rust/WASM ([sentence difficulty](https://nuenki.app/sentencedifficulty)). Translations from DeepL, Claude, GLM-4.7, Gemma 4. Skips sensitive sentences and pages. Pinyin and furigana "where they fit."

HN Show HN, 2024-09-21 ([HN 41609346](https://news.ycombinator.com/item?id=41609346)): "even at the most difficult level it highlighted only a few random sentences on the page"; "the price is too high for what it does"; "I found myself wanting to quickly toggle the add-on (e.g. off for serious work)"; author: "Users don't automatically progress"; author on LLM quality: native speakers "weren't very positive about LLMs, particularly with French." One commenter preferred "the sentence approach as compared to toucan's word-only extension." Hunted.space comments called translations "sometimes off" and the tool "distracting" (via search). Nuenki's blog: "The more LLMs think, the worse they translate."

### Smaller and older entrants

- Fluent Tab (Firefox, dBuidl): 1-30% density, three levels, hover shows English, 11 languages, GPL-3.0; "only selected words are sent for translation" ([AMO API](https://addons.mozilla.org/api/v5/addons/addon/fluent-tab/)).
- Progressive Immersion (AidanWelch, open source): frequent words via Google Translate; exclusion list; listing warns that selected words go to Google, "a privacy risk"; "will not teach you a language" ([ChromeBoard](https://chromeboard.com/extension/progressive-immersion-glhikloekamfeiakikebcndppkgldloj)).
- Word Sponge: 254 users, 5.0 from 2, last update Aug 2023; click toggles back; one reviewer: "kindly add more languages please."
- Uvaaj: v1.0.0, 2026-09-05; claims "Website text is processed locally within your browser"; difficulty and frequency settings.
- Vocabo: single-word swaps, 249+ languages, tap to save with audio, no account.
- Lingo Champion: set "how many words or sentences to translate"; paid platform.
- WordSwap, Sneaky Lingo, LinguaSwap (DeepL/OpenRouter, ~20 users): user-supplied word pairs only.
- Immersed (itch.io, in development): "can cause formatting problems on some sites."
- "Learn a new language passively" (EN-RU, ~800 noun pairs): a reviewer said single-word swaps teach wrong senses of polysemous words (search snippet; listing now unavailable).
- NeonLingo "Immersion mode (Beta)": i+1 claim, 30 languages, 200 free translations/month; vendor claims only.
- Language Immersion for Chrome (Google with Use All Five, 2012): Google Translate API on "intermittent phrases," difficulty slider; gone.
- Lingua.ly (2013): double-click to save; defunct by 2018.
- Toucan clones on GitHub: `misteraverin/diglot-weave` (2016), `Sasha-Str/diglot-weave`, `lukehegelund/diglot-weave`, `JohnDoes/Diglot-Weave` ("on-device and serverless gradual translation... reader", 2026), `steve-perkins/innesto` (ebook reader, 2026), `lexweave-hq/lexweave` (LLM-compiled graded readers), `1Aa1k/weave` (reader with FSRS), `shmsk/lazy-polyglot` (diglot weave for CLI agents, 2026-10-14). None is a maintained general-page Chrome extension with users.

### french-weave (reference implementation)

Created 2026-10-14, MIT, 19 stars ([GitHub](https://github.com/jackieoliver/french-weave)). Facts from the code:
- Lexicon: `data/lexicon.csv` with `fr,en,hint` rows; entries carry articles ("le problème", "la question", "l'idée").
- Prompt density is per sentence: L1 "about one French word every sentence or two"; L2 "one or two French words in every sentence." A per-passage cap in `levels.js` keeps learning words ahead of known ones.
- Prompt rules: "Never touch names, handles, hashtags, URLs, numbers, code, or quoted titles." "Comprehension beats the level: skip a passage entirely if a swap would make it hard to follow." Output is JSON per passage with `o` (exact source), `f`, `g` (gloss), `h` (sound hint), `ctx` (2-4 words copied from the passage).
- DOM: `PROSE = p,li,blockquote,h1,h2,h3,h4,article,main`; blocked `a,button,input,textarea,select,form,nav,header,footer,code,pre,kbd,samp,script,style,[contenteditable],[role=textbox],[hidden],[aria-hidden],[translate=no],.notranslate`; skips `/login`, `/checkout`, `/billing`, `/settings`, `/account` paths; respects `lang` attributes; passages 6 words to 2000 chars; sensitive-topic regexes (health, finance); MutationObserver for new content; `splitText` plus spans with `aria-label`.
- Events: seen and peek once per word per day; gloss appears after a dwell and counts as a peek; click or Enter flips.
- Promotion: 20 active words max, 5 new per day, none while 5+ are shaky; learning to known after 3 exposure days with no flip/learn/peek on the last 3; shaky to known after 7 clean days; stages at 40/150/400 known.
- Ops: daily model-call quota, per-model cooldown, retry with backoff, a 5,000-entry cache; key kept in the background worker.
- Limits stated: prompts built for levels 1-2 only; free-tier Gemini keys let Google train on prompts.

## 3. Answers to the four questions

### Q1. Did Toucan publish learning-outcome data or its word-selection method? What did reviewers say about wrong-sense swaps and grammar?

No outcome data was found. The About page claims the method is "proven to be just as (and sometimes more) effective as flash cards" without a citation. The 2022 blog posts cite reading research in general, not Toucan results; one author's metric was "I knew I was making progress when I stopped hovering." An ECLL2022 conference paper by Toucan staff (Ashtari, Goitia, Moorman, "Technology, Toucan, and Language Education", DOI 10.22492/issn.2188-112X.2022.7) frames the tool with Krashen's i+1 and the affective filter and claims "hundreds of thousands" of users; the PDF returned 403, so no data could be checked ([IAFOR listing](https://papers.iafor.org/?p=66377)).

Word selection was never specified beyond: curated language packs of English trigger words, human translation, NLP for "contextual accuracy", topic packs, and "progressively larger lexical chunks" (sources in section 2).

Wrong-sense and grammar evidence is consistent across five years: "He nunca looked espalda" (Edge review), "application -> solicitud" and "run -> corrida" in a programming tutorial (Substack 2021), "translating words out of context so the translation makes no sense" and "joining words together (removing spaces)" (Chrome, Oct 2026), "simply translates words without contextualizing" (Firefox, French). No reviewer reported article or gender agreement being handled; the errors show that swaps are inserted as bare tokens.

### Q2. Common failure modes across products

1. Wrong word sense from single-token swaps: Toucan (above); the EN-RU "passively" extension reviewer; Substack on polywords; illa-helper #92. Alignment (LoomVue) and sentence-level translation (Nuenki) were the two responses before LLMs.
2. Level and density not honoured: illa-helper #104/#87/#70/#99 and two store reviews; #115 (upper-intermediate still swapping "we", "are"); Nuenki "only a few random sentences" even at the top level; Fluent "lacks a clear way to gauge a user's level"; Toucan "Many" is "distracting".
3. Page rewriting damage: Toucan removing spaces; Immersed "formatting problems on some sites"; illa-helper links inside highlighted paragraphs not clickable (#96, #91) and partial-page translation (#95); Toucan and Fluent together making words "disappear".
4. Privacy and trust: Toucan hostname tracking (HN), analytics SDKs in the manifest, no self-service account deletion; Progressive Immersion's own warning about Google Translate; Slate claiming on-device while disclosing data collection; Weeve billing.
5. Need a fast off switch: Nuenki ("off for serious work"), Toucan's "Indefinitely off" "buried under several clicks" (Substack), Fluent praised for one-click off.
6. Grammar artefacts: Weeve his/her gender mix-ups; Toucan wrong part of speech.
7. Speed and cost of LLM calls: illa-helper #79 "AI is a bit slow"; Nuenki "DeepL is really quite expensive" and price complaints; Weeve's 50% GPT-4 accuracy claim pushed them to custom data.

### Q3. Non-Latin scripts

- Toucan: Japanese, Korean, Chinese, Arabic, Hebrew, Hindi targets; a settings option to "choose the alphabet shown for languages with unique scripts" (romanisation implied; options undocumented); audio on hover. Japanese was "still in beta" per a WaniKani forum user.
- Language Lens: per-word kanji toggle; `<ruby>` furigana rendering in code; audio.
- Polyglotl: "reading" plus "character breakdown for logographic scripts"; spoken pronunciation.
- Nuenki: Pinyin and furigana "where they fit"; audio; sentence-level so scripts appear as full sentences.
- illa-helper: JA/KO/ZH targets with screenshots; phonetics come from an English Dictionary API, so IPA is English-side; Youdao TTS; one bug turned zh->en into pinyin (#85).
- LingoLayer: "phonetic guide" for all 10 languages including Japanese and Hindi.
- MindTheWord: n-gram setting counts "consecutive words or characters," the only accommodation for unspaced scripts.
- Fluent Tab: JA, KO, ZH targets; hover shows English only.
No product documents furigana over swapped Japanese in-page except Language Lens (ruby) and Nuenki (claimed).

### Q4. Built-in TTS and Chrome's on-device AI

TTS usage found. LingoLayer: "browser's built-in speech synthesis" as the free voice, ElevenLabs paid. illa-helper: Web Speech API as fallback to Youdao TTS, with in-memory audio cache. MindTheWord: ResponsiveVoice. Toucan, Fluent, Nuenki, Polyglotl: audio present, engine undocumented. Chrome extensions also have `chrome.tts` (permission `tts`; OS voices on Windows, macOS, ChromeOS; `getVoices`, `speak`, word/sentence events) ([chrome.tts](https://developer.chrome.com/docs/extensions/reference/api/tts)).

On-device AI usage found. Slate uses Gemini Nano through the Prompt API (listing). JohnDoes/Diglot-Weave describes itself as on-device, unverified. No other product in this survey uses Chrome's built-in AI.

Chrome built-in AI availability (developer.chrome.com, read 2026-10-15):
- Prompt API: "available from Chrome 138 stable, only for Chrome Extensions." Web availability is listed at Chrome 148 ([built-in APIs table, updated 2025-09-12](https://developer.chrome.com/docs/ai/built-in-apis)). Chrome Status shows the web origin trial on desktop at 139-144, extended through 147, with 148 as the shipping milestone and status "Proposed" ([Chrome Status 5134603979063296](https://chromestatus.com/feature/5134603979063296)).
- Extension specifics ([Prompt API page, updated 2026-08-26](https://developer.chrome.com/docs/ai/prompt-api); [extensions page](https://developer.chrome.com/docs/extensions/ai/prompt-api)): extensions may set `topK` and `temperature` (both or neither) and read `LanguageModel.params()`; remove the expired `aiLanguageModelOriginTrial` permission; not available in Web Workers; `create()` needs user activation before a download; context overflow drops oldest turns and fires `contextoverflow`; `QuotaExceededError` when input cannot fit. Input: text, image, audio. Output: text. Output languages: en, ja, es, de, fr (from Chrome 149 per the get-started page).
- Translator API and Language Detector API: stable from Chrome 138 for web and extensions; desktop only; language packs download on demand; per-pair status is hidden until a translator is created ([Translator API](https://developer.chrome.com/docs/ai/translator-api)). Summarizer: stable 138. Writer, Rewriter, Proofreader: origin or developer trials.
- Hardware (Prompt, Summarizer, Writer, Rewriter, Proofreader): Windows 10/11, macOS 13+, Linux, ChromeOS 16389.0.0+ on Chromebook Plus; no Android, iOS, or other ChromeOS; at least 22 GB free on the profile volume; GPU with more than 4 GB VRAM, or CPU with 16 GB RAM and 4+ cores; unmetered network for the first download; the model is deleted if free space drops under 10 GB ([get started](https://developer.chrome.com/docs/ai/get-started)).
- Model size: the docs give no figure and say to check `chrome://on-device-internals`. Press measured roughly 4 GB on disk (`OptGuideOnDeviceModel/weights.bin`) in Chrome 147 ([9to5Google, 2026-05-06](https://9to5google.com/2026/05/06/google-chrome-4gb-storage-ai-details/)); an August 2026 report quotes a 20 GB free-space figure, while the docs still say 22 GB ([Ubergizmo, 2026-08-07](https://www.ubergizmo.com/2026/08/chromes-on-device-ai-20gb/)). Users can disable "On-device AI" under Settings > System.
- Policy: built-in models are "not considered remote hosted code"; API keys must not ship in the extension; server-side proxies and privacy-policy updates are expected when user text leaves the device ([AI in extensions](https://developer.chrome.com/docs/extensions/ai)).

Implication. A Chrome-138+ extension can use Gemini Nano with no key, but only on a minority of machines (desktop, 22 GB free, 4 GB VRAM or 16 GB RAM). A hybrid design (on-device when `availability()` is "available", BYO cloud key otherwise) is the only path that covers both.

## 4. What to steal, what to avoid

Steal
1. Context-aware selection with sentence evidence. Toucan's five years of "espalda"/"solicitud" errors, and the EN-RU reviewer, show that bare-token swaps teach wrong senses. french-weave's `ctx` field and Slate's "reads the surrounding sentence" are the right unit; Nuenki's English-side scoring shows selection can be cheap before the LLM runs.
2. Count density per sentence, not per page, and cap per passage. illa-helper's percent-by-characters slider is the most complained-about control in its tracker (#104, #87, #70, #99). french-weave's per-sentence prompt plus a hard cap is simpler to honour.
3. Hard DOM exclusions and route exclusions. french-weave's blocked selectors (`a, input, textarea, code, pre, [contenteditable], [translate=no]`) and `/login|checkout|billing` path skips answer Toucan's "joining words together", Immersed's formatting breaks, and the HN banking-whitelist embarrassment.
4. Learning-first scheduling with few active words. Toucan "Many" and illa-helper over-translation show that more swaps feel like noise. french-weave's 20 active, 5 new per day, learning-before-known ordering gives repetition without clutter.
5. Dwell-to-gloss as a peek signal; click to flip. french-weave counts a gloss shown after a dwell as a peek that holds a word back. Fluent's hover-quiz and Polyglotl's "known words fade back to plain text" are the same idea in UI form.
6. Lazy, incremental, cached processing. illa-helper translates paragraphs on scroll, processes only new nodes, and caches TTS audio; this is why it has 2.9K stars with a BYO-key model.
7. Show grammar in the tooltip and carry articles in the lexicon. LingoLayer shows gender, case, and conjugation on hover; french-weave stores "le problème"/"la question". This is the cheapest answer to Weeve's his/her complaint and Toucan's part-of-speech errors.
8. Local keys, no backend, visible token budgets. Language Lens's daily and monthly token limits, LingoLayer's "no backend", and french-weave's background-worker key and daily call quota address the privacy and cost complaints that dog Toucan and Nuenki.
9. One-click pause, per-site toggles, and sensitive-topic skips. Nuenki's "off for serious work", Substack's buried "Indefinitely off", and french-weave's health/finance regexes and off-by-default webmail all point the same way.
10. Hybrid on-device first. Use the Prompt API when `LanguageModel.availability()` returns "available" (Chrome 138+, desktop, 22 GB free, 4 GB VRAM or 16 GB RAM), and fall back to a BYO cloud key; Slate is on-device only and has 5 users.

Avoid
11. Random or percentage-only selection (MindTheWord, Fluent Tab, Word Sponge): all are dead or tiny, and MindTheWord's 3.09/5 rating is the record.
12. Server-side page processing with analytics SDKs and no account deletion (Toucan's Segment/Amplitude/Optimizely CSP, "no way to deleting your account").
13. Subscription gating on the review loop (Weeve premium review system, Nuenki's $5.42/month with "price is too high for what it does"): every paid swap product in this survey is dormant or under 50 users.
14. Claiming learning outcomes without data. Toucan's "as effective as flash cards" has no citation; the only paper is company-authored. Publish seen/peek/flip-derived retention numbers instead.
15. Claiming on-device privacy while declaring data collection (Slate discloses history, activity, and content). Match the store disclosure to the architecture.

## Sources

- french-weave README and code: https://github.com/jackieoliver/french-weave
- Toucan Chrome listing and reviews: https://chromewebstore.google.com/detail/toucan-language-learning/lokjgaehpcnlmkebpmjiofccpklbmoci (reviews at /reviews)
- Toucan site, About, blog feed: https://jointoucan.com/ , https://jointoucan.com/about , https://blog.jointoucan.com/feed
- Babbel press release 2023-09-19: https://www.babbel.com/press/en-us/releases/keep-learning-while-browsing-babbel-to-integrate-toucan-browser-extension
- Babbel support article: https://support.babbel.com/hc/en-gb/articles/18269893246738-Toucan-browser-extension
- Edge add-on API: https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/ljbocbkhabkbkedlhmppmpfajejdkoei
- HN Toucan 2020: https://news.ycombinator.com/item?id=23078725
- Substack "Escaping Duolingoland" 2021-03-15: https://naturallyprocessed.substack.com/p/escaping-duolingoland
- Hulry review 2022: https://hulry.com/toucan-learn-language/
- ghacks review: https://www.ghacks.net/?p=179499 (article body did not render; facts via search snippet)
- ECLL2022 paper listing: https://papers.iafor.org/?p=66377
- Fluent: https://dailyhive.com/calgary/fluent-language-chrome-extension , https://www.producthunt.com/products/fluent-2-0
- MindTheWord: https://github.com/OiWorld/MindTheWord , https://www.crx4chrome.com/extensions/fabjlaokbhaoehejcoblhahcekmogbom/
- LoomVue: https://extensionauditor.com/scan/loomvue-aefcifgalkppllljlnepjmgmfikhhbmk (403 on fetch; via search)
- Weeve: https://growingseason.substack.com/p/weeve-is-building-a-bridge-across , https://www.trustpilot.com/review/weeve.ie
- illa-helper: https://github.com/xiao-zaiyi/illa-helper (issues #70, #79, #83, #85, #87, #92, #95, #99, #104, #115), https://extscope.org/extension/ekeljkknchehakckhghhkbalnnmgnche
- Slate: https://chromewebstore.google.com/detail/nkckkmiddidlnfhclmalojibnibigokd
- Language Lens: https://addons.mozilla.org/api/v5/addons/addon/language-lens/ , https://github.com/mruwnik/language-lens
- LingoLayer: https://chromeboard.com/extension/lingolayer-monnagfmknbolicehkbhlhlbeoalpmbc
- Polyglotl: https://chromewebstore.google.com/detail/polyglotl/fmgngkladnkgakadabolebbkgcoomhng
- Nuenki: https://nuenki.app/ , https://nuenki.app/sentencedifficulty , https://news.ycombinator.com/item?id=41609346 , https://addons.mozilla.org/api/v5/addons/addon/nuenkiext/
- Fluent Tab: https://addons.mozilla.org/api/v5/addons/addon/fluent-tab/
- Progressive Immersion: https://chromeboard.com/extension/progressive-immersion-glhikloekamfeiakikebcndppkgldloj
- Word Sponge reviews: https://chromewebstore.google.com/detail/word-sponge/kiphhbngjiidccgcebflhlmmabighbem/reviews
- Uvaaj: https://chromeboard.com/extension/uvaaj-doanegnnaepfdpogkfldhhjcgfjplfee
- Language Immersion for Chrome: https://www.useallfive.com/work/language-immersion
- Chrome built-in AI: https://developer.chrome.com/docs/ai/built-in-apis , https://developer.chrome.com/docs/ai/prompt-api , https://developer.chrome.com/docs/extensions/ai/prompt-api , https://developer.chrome.com/docs/ai/get-started , https://developer.chrome.com/docs/ai/translator-api , https://developer.chrome.com/docs/extensions/ai , https://chromestatus.com/api/v0/features/5134603979063296 , https://developer.chrome.com/docs/extensions/reference/api/tts
- Model size press: https://9to5google.com/2026/05/06/google-chrome-4gb-storage-ai-details/ , https://www.ubergizmo.com/2026/08/chromes-on-device-ai-20gb/
