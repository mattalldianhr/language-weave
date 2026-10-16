# Language Weave extension: design

Date: 2026-10-16. Status: approved by Matt 2026-10-16 (density made a reader setting with no ceiling).

Language Weave is a browser extension that swaps a few English words on any page for a target language. It is a diglot weave: the reader keeps reading English and meets the same foreign words again and again until they stick. This document fixes the v1 design. Every rule below cites the research in `research/` rather than the inspirations (`french-weave`, Ferriss).

## 1. Goals and non-goals

Goals for v1:

- Any website, in Chrome, with no build step and no backend.
- Five target languages at launch: Spanish, French, German, Italian, Portuguese.
- Works with nothing configured: no key, no on-device model, no network.
- Gets better when more is available: Chrome's on-device Translator and Prompt APIs, or a cloud key the user owns.
- Wrong-sense swaps are the market's top complaint (`research/landscape.md` §3 Q2). Precision beats density everywhere in this design.
- Installable by a coding agent from the repo, as the homepage promises.
- Written to the WebExtensions common subset so Safari and Firefox for Android are packaging work, not rewrites (`research/platforms.md` §4).

Non-goals for v1 (tracked for later):

- Japanese and Chinese. Their top lists need target-side selection and ruby rendering (`research/coverage-report.md` §"What this means" item 10; `research/landscape.md` Q3).
- Safari and Firefox packaging, the native reader app, and any system-wide overlay (`research/platforms.md`).
- The Claude Code plugin, transcript scanning, and native messaging from `french-weave`.
- Text-to-speech, multiple-choice glosses, and reader-domain word selection (literature items 12 and 18). These are v2 candidates.
- A Web Store listing.

## 2. Architecture

The design is layered. A deterministic candidate layer proposes swaps. A pluggable verifier confirms or extends them. Nothing is painted onto the page without passing the strictest layer available.

```
page text ──► scan ──► tag (compromise) ──► rules ──► candidates
                                                        │
                      ┌─────────────────────────────────┘
                      ▼
            verifier chain (background)
            1. LLM: Prompt API (on-device) or cloud adapter
            2. Translator API agreement check
            3. none: conservative rules only
                      │
                      ▼
            schedule (which learning words, how many) ──► paint ──► events
```

Why this shape, in one line each:

- The experiment shows rules alone top out at 90–92% correct at about 2 swaps per 100 words (`research/experiment-deterministic.md` §Decision 1). That is the free, offline floor.
- Reaching 3–5 per 100 at 97% needs a sense-aware selector (Decision 7). The verifier is that selector, and it does a small, auditable, cacheable job.
- The model never rewrites page text. It answers yes/no per candidate and may add candidates from the learning set, always in a form the pack already knows. Output is validated fail-closed.

## 3. Components and boundaries

All source is plain ES modules. No bundler. `compromise` is vendored as one prebuilt file (MIT). Development needs Node only for tests.

```
extension/
  manifest.json
  src/background.js         message router, verifier chain, store, alarms
  src/content-loader.js     injects the module content script (french-weave pattern)
  src/weave/scan.js         block selection, exclusions, text flattening
  src/weave/tag.js          compromise wrapper: tokens, POS, lemmas, noun phrases
  src/weave/candidates.js   rule layer (pure)
  src/weave/paint.js        DOM swap spans, restore
  src/weave/interact.js     gloss, flip, seen/peek/flip events
  src/shared/pack.js        pack schema, validation, form lookup (pure)
  src/shared/schedule.js    progression and selection (pure)
  src/shared/prompt.js      verifier prompt contract and output parser (pure)
  src/shared/text.js        hashing, sentence split, whitespace (pure)
  src/providers/translator.js   Chrome Translator API check
  src/providers/prompt-api.js   Chrome Prompt API (Gemini Nano)
  src/providers/anthropic.js, gemini.js, openai.js   cloud adapters, one interface
  src/popup/                on/off, site, language, level, providers, today's words
  vendor/compromise.js
  packs/{es,fr,de,it,pt}.json
  test/                     node --test
tools/make-pack/            Python; builds packs from research/experiment
tools/eval/                 replays the research corpus through the real rule module
INSTALL-FOR-AGENTS.md
```

Boundaries:

- `weave/*` runs in the page. It never holds a key and never calls the network.
- `background.js` owns state, keys, quotas, and every provider call.
- `shared/*` is pure and runs in both worlds and in tests.
- Providers implement one interface: `verify({lang, sentences, candidates, learning}) → {verdicts, extras}` and `availability()`.
- The content script talks to the background only by message. Each reply carries the config generation it answered, and stale replies are dropped (`french-weave` content.js pattern).

Platform constraints honoured from `research/platforms.md` §1: no native messaging, no `storage.sync` reliance, no `webRequestBlocking`, no `windows.create`, background treated as ephemeral (service worker in Chrome, event page elsewhere). Everything persistent lives in `storage.local`.

## 4. Language packs

A pack is one JSON file per language, prebuilt in the repo. Schema per entry, keyed `lemma|POS`:

| field | meaning |
|---|---|
| `target` | citation form in the target language |
| `sense` | English sense the target covers, shown in the gloss |
| `dominant` | true when that sense covers ~90% of English uses (experiment F2 flag) |
| `note` | ambiguity note for the verifier prompt |
| `forms` | nouns: gender, singular and plural with article, German articles by case; adjectives: four forms and prenominal flag; verbs: infinitive and present table |
| `class` | `conn`, `adv`, `noun`, `adj`, `verb` |
| `tier` | 1–3 ordering for introduction: cognate and concrete first (literature items 13, 14) |
| `hint` | pronunciation respelling for the gloss |

Pack-level fields: `lang`, `revision`, `blocklist` (English multiword expressions a swap may not overlap; from `research/experiment/mwe_blocklist.txt`), `drop` (lemmas under 50% in `per-lemma.csv`).

Selection rule for the ~300 entries per pack, from `research/coverage-report.md` §"What this means":

- Content words first. Frequency order from `wordfreq`, not subtitles (items 1, 2, 5).
- No bare function words as targets (literature item 15).
- Nouns carry their article (literature item 16; Arnon & Ramscar 2012).
- Adverbs, quantifiers, and connectors are the richest safe class (item 11), minus the recurring errors: long, too, ago, yet, even, especially, anyway (experiment Decision 3).

`tools/make-pack` reuses `research/experiment/build_lexicon.py` and `gen_packs.py`. It takes a language code and a provider command, emits the pack, and runs the schema validator. New languages are a script run plus an eval run.

## 5. Swap and verify data flow

Per page, in the content script:

1. **Scan.** Blocks matching `p, li, blockquote, h1–h4, article, main`, excluding `a, button, input, textarea, select, form, nav, header, footer, code, pre, kbd, samp, [contenteditable], [role=textbox], [role=button], [hidden], [aria-hidden], [translate=no], .notranslate`. Blocks with a non-English `lang` are skipped. Routes matching `/login|checkout|billing|account|bank/` and pages matching the health and finance topic regexes are skipped whole. A `MutationObserver` tracks new blocks; an `IntersectionObserver` defers work until a block is near the viewport (illa-helper pattern, `research/landscape.md` §4 item 6).
2. **Tag.** `compromise` tags each block: tokens, POS, lemma, noun phrases with determiners. It agrees with spaCy on 88% of tokens and costs under a point of precision (experiment §Tagger comparison).
3. **Candidates.** The rule layer applies only the conservative configuration: connectors; adverbs not on the blocklist; article plus noun; article plus adjective plus noun (experiment §Conservative configuration). Verbs, bare nouns, predicative adjectives, and phrases are never rule candidates (Decision 4). German article plus noun needs a case; the rule layer assigns nominative only to sentence-initial subjects and leaves the rest to the verifier. Each candidate carries its sentence, lemma, POS, and the exact target form.
4. **Verify.** The background runs the first available tier:
   - **LLM tier.** Prompt API when `LanguageModel.availability()` is `available`, else a cloud adapter when the user has set a key. Input: the sentences, the candidates, and the learning-set words not yet proposed. Output: accept or reject per candidate, plus optional extra swaps for learning words. Every accepted form must exist in the pack's form table for that lemma, or it is rejected. Extras in classes the rules exclude (verbs, bare nouns) are allowed only from this tier, because the model has the sentence.
   - **Translator tier.** When no LLM is available and the Translator API is: translate the sentence, accept a candidate only if the pack form appears in the translation. This is the experiment's F3 check (93.7–96.9% on the conservative set).
   - **None.** Candidates ship unverified, conservative set only, with the dominant-sense flag required. This is the 90–92% floor.
   Verdicts are cached in `storage.local` by pack revision, sentence hash, and candidate. Cache size is capped with LRU eviction.
5. **Schedule.** Pure selection over verified candidates (see §6). It decides which words and how many.
6. **Paint.** Each swap replaces text inside one text node only, never across element boundaries, preserving whitespace. The span holds the English original, the lemma, and the sense. Pause or disable restores every original in place.

Density is the reader's setting, with no ceiling. The default is 1 swap in 33 running words and at most one swap per sentence, inside the literature's comfort band of 1 in 50 to 1 in 20 (items 1, 2). The reader can set it anywhere from 1 in 100 up to every eligible word, and can lift the one-per-sentence cap. The settings page shows the research band and what leaving it costs to comprehension, and does not stop the reader. The setting is honoured exactly: the schedule counts swaps per block against the ratio rather than estimating a page percentage, because ignored density sliders are the most complained-about control in the market (`research/landscape.md` §3 Q2 item 2). At high settings the limit becomes supply: only verified candidates are painted, so precision never drops to meet the number. When the learning set cannot fill the budget, the schedule draws on known words and then on queue words as extras that do not enter the learning window, so intake and promotion rules are unchanged.

## 6. Progression

State per language in `storage.local`: for each lemma, a status (`queue`, `learning`, `shaky`, `known`), encounter log by day, and last peek and flip dates. The rules adapt `french-weave`'s schedule to the literature's encounter counts.

- **Learning window.** Up to 20 words in `learning` at once. New words enter at a user-set rate, default 3 per day, maximum 5 (literature item 19: observed intake is 0.8–4 per day). No new words while 5 or more are `shaky`.
- **Introduction order.** Pack `tier` first, then frequency. Cognates and concrete nouns come before abstract words (items 13, 14).
- **Selection on a page.** Candidates are ranked: `learning` words that are due, then other `learning` words, then `known` words for re-exposure (at most one in five swaps, item 20), then new words from the queue if today's intake allows. A word is shown at most 3 times per day so its encounters spread across days (item 6).
- **Due.** A learning word is due 1–3 days after its last encounter, then about a week, then 3–4 weeks (item 7).
- **Events.** `seen` fires once per day per word when the span is visible. `peek` fires when the gloss opens on hover or focus after the dwell. `flip` fires on click or Enter, which restores the English word.
- **Gloss timing.** First encounter of a new word shows the gloss at once with no delay (item 10). From the second encounter, the gloss appears after a 700 ms dwell, and reaching it counts as a peek (items 8, 9). The 700 ms figure is a UX guess, flagged in the literature's open questions.
- **Promotion.** `learning` → `known` after at least 10 `seen` encounters across at least 4 days spanning a week or more, with no peek or flip on the last 3 encounter days (items 3, 4, 5). `flip` sends a word to `shaky`. A `known` word peeked on 2 different days within 7 becomes `shaky`. `shaky` → `known` after 7 days with no peek or flip.
- **Level seeding.** The installer asks how much of the language the user knows and marks the top 0, 40, or 150 pack entries `known`. Seeding never lowers existing progress.

Only `isTrusted` events on spans the extension made produce events, so pages cannot forge progress.

## 7. Settings and surfaces

Popup: global on/off, this-site on/off, target language, density (a slider from 1 in 100 to everything, default 1 in 33, with the research band marked), new words per day, provider status (on-device available or not, cloud key set or not), and today's learning words with status. Options page: cloud provider and key, the one-swap-per-sentence cap, site allow and deny lists, sensitive-topic skips, export and import of progress as JSON, a reset per language.

Keyboard: one command toggles the extension off and restores every page. Nuenki and Toucan reviewers asked for a fast off switch (`research/landscape.md` §3 Q2 item 5).

Cloud keys live only in `storage.local`. The host permission for a provider's endpoint is optional and requested when the key is saved. Only the sentences containing candidates leave the device, never whole pages, and only on the cloud tier. There is no analytics and no remote code. The options page states exactly this.

## 8. Error handling

- Every verifier failure falls back one tier for that passage. Timeouts and quota errors count as failures. The page is never left half painted: a block is painted only after all of its candidates have verdicts.
- Malformed model output, an unknown lemma, or a form not in the pack rejects that candidate. Nothing is invented.
- A daily call quota per provider, with the count shown in the popup. Exhaustion degrades to the next tier with a popup notice.
- Provider retries use backoff, at most 3 per block, keyed by text hash.
- `storage.local` pressure evicts the verdict cache before anything else. Progress is never evicted.
- A page's own scripts can remove or re-render our spans. The observer re-scans changed blocks and reuses cached verdicts, so flicker is bounded to the changed block.
- Pack validation runs at load. A pack that fails validation disables its language with a visible error rather than painting from a bad table.

## 9. Testing

- **Unit** (`node --test`): rules, schedule, pack validation, prompt output parsing, text utilities. Pure modules, no browser.
- **Precision eval** (`tools/eval`): replays the 27-document research corpus through the real `candidates.js` and a chosen verifier, judged with the experiment's judge prompt via `claude -p`. Gates: conservative set at or above 90% correct; LLM tier at or above 95%; painted density matches the setting at the default, at 1 in 100, and at the maximum. The harness is how a new language or a changed rule gets accepted.
- **Browser integration** (Playwright, Chromium with the extension loaded): fixture pages for prose, forms, code, links, a dynamic feed, and a non-English page. Checks: no swap inside excluded nodes, one text node per swap, originals restored on pause and on the keyboard toggle, density matching the setting at three values including the maximum, events only from trusted input, zero console errors.
- **Cross-browser lint**: `web-ext lint` for Firefox and a manifest check against the Safari subset, so the common-subset promise holds without shipping those builds yet.

## 10. Install

`INSTALL-FOR-AGENTS.md` tells a coding agent to clone the repo, run the tests, ask the three setup questions (language, how much you know, cloud key or not), write the seed settings, and hand the human the one step Chrome reserves for people: Developer mode, Load unpacked, pick the folder. The homepage prompt points at this file. Keys are never typed into chat; the human pastes them into the options page.

## 11. Differences from french-weave, and why

- Deterministic floor instead of Gemini-only: works with no key, offline, on every platform.
- Candidates and verdicts instead of free-form model output: fail-closed, cacheable, auditable.
- Encounter counts instead of day counts for promotion: the literature counts encounters (items 3, 4).
- Any site by default instead of X only, with the same exclusion list.
- No native messaging and no plugin: portability per `research/platforms.md`.

## 12. Open questions for v1

- The 700 ms dwell and the 1-in-33 default density are guesses inside the research bounds. Both are settings, density without a ceiling, and the eval harness will report them, not the literature.
- German case without a dependency parser: v1 relies on the verifier for everything except sentence-initial nominatives. The eval will report German density in the no-verifier tier.
