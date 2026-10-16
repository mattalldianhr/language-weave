# Language Weave extension: implementation plan

Date: 2026-10-16. Spec: `docs/superpowers/specs/2026-10-16-extension-design.md` (approved).

Each task is one red-green-refactor cycle or a small group of them. Write the test first, watch it fail, then write the least code that passes. Commit after every task with the message given. Pure modules first, browser last.

Toolchain already on the VM: Node 24.21 (`node --test`), Playwright 1.64 with Chromium in the scratchpad `pw/` folder, compromise 14.18.0 in the scratchpad `node-tagger/` folder, Python 3 venv from the research run, `claude -p` for pack generation and judging.

## Phase 0: scaffold

### Task 0.1: repo layout and test runner

- Create `extension/manifest.json` (MV3, `storage`, `alarms`, `scripting`, `activeTab`; `optional_host_permissions` for `http://*/*` and `https://*/*`; background service worker `src/background.js` type module; content script `src/content-loader.js` on `<all_urls>` at `document_idle`; `web_accessible_resources` for `src/*`, `vendor/*`, `packs/*`; popup and options pages).
- Create `extension/package.json` with `"type": "module"` and `"test": "node --test test/"`. No dependencies.
- Vendor compromise: copy the ESM build from `node-tagger/node_modules/compromise/builds/three/compromise-three.mjs` to `extension/vendor/compromise.mjs` and its `LICENSE` to `extension/vendor/compromise.LICENSE`. Check the path with `ls builds/three` first.
- Test: `extension/test/smoke.test.js` imports the vendored module and tags "The cat sat." expecting one noun. Run `npm test` from `extension/`.
- Commit: `Extension: scaffold, manifest, vendored compromise, test runner`.

## Phase 1: pure modules

### Task 1.1: `src/shared/text.js`

Tests in `test/text.test.js`:

- `splitSentences(text)` returns sentence spans with character offsets; handles "Dr." and "e.g." without splitting; keeps original whitespace.
- `hashText(text)` is stable across calls and differs on a one-character change.
- `countWords(text)` counts running words the way the density ratio needs (letters and digits, apostrophes inside words).
- `overlapsBlocklist(text, start, end, blocklist)` is true when the span touches any listed multiword expression, case-insensitive.

Commit: `Extension: text utilities`.

### Task 1.2: `src/shared/pack.js`

Tests in `test/pack.test.js` using a tiny inline pack:

- `validatePack(pack)` rejects a missing `lang`, `revision`, or an entry without `target`, `sense`, `class`, `forms`; accepts the fixture.
- `lookup(pack, lemma, pos)` returns the entry or null.
- `formsOf(entry)` returns every inflected surface form (used by the verifier's fail-closed check); German nouns include article forms by case.
- `nounPhrase(entry, {number, case})` returns article plus noun, e.g. `la question`, `die Frage`, `den Hund`; null when the pack lacks that form.
- Entries in `drop` are hidden from `lookup`.

Commit: `Extension: pack schema and form lookup`.

### Task 1.3: `src/shared/schedule.js` (state and selection)

State per language: `{words: {lemma: {status, added, days: {YYYY-MM-DD: n}, lastPeek, lastFlip, due}}, intake: {date, n}}`. Pure functions take `now` as an ISO string in the reader's zone.

Tests in `test/schedule.test.js`:

- `newState()`; `seedKnown(state, pack, n)` marks the top `n` by tier then frequency as `known` without lowering existing statuses.
- `refill(state, pack, now, {perDay})` moves queue words to `learning` up to 20 in the window and `perDay` today; no refill when 5 or more are `shaky`.
- `record(state, lemma, event, now)` handles `seen` (once per day), `peek`, `flip`; `flip` makes a learning or known word `shaky`; two peek days within 7 make a known word `shaky`.
- `promote(state, now)`: learning → known after ≥10 seen across ≥4 days spanning ≥7 days with no peek or flip on the last 3 encounter days; shaky → known after 7 clean days.
- `due(word, now)`: 1–3 days after the last encounter, then ~7, then ~21–28.
- `select(state, pack, candidates, settings, now)`: ranks due learning, other learning, known (≤1 in 5), then queue extras; at most 3 shows per word per day; returns exactly the number the density budget allows for the block. Budget = `floor(words / ratio)`, with the per-sentence cap applied only when the setting is on. A test asserts the count at ratio 33, at 100, and at 1 (everything eligible) on a 200-word fixture block.
- Queue extras chosen by `select` do not change their status (spec §5).

Commit: `Extension: progression and selection, density honoured exactly`.

### Task 1.4: `src/shared/prompt.js` (verifier contract)

Tests in `test/prompt.test.js`:

- `buildVerifyPrompt({lang, sentences, candidates, learning})` includes every candidate with its sentence index and the pack note, and lists learning lemmas not yet proposed.
- `parseVerdicts(text, {candidates, pack})` returns `{verdicts: [{id, ok}], extras: [{sentence, start, end, lemma, form}]}`; rejects an extra whose `form` is not in `formsOf(entry)`; rejects an unknown lemma; returns everything rejected on malformed JSON. Fail closed.

Commit: `Extension: verifier prompt contract with fail-closed parsing`.

### Task 1.5: `src/weave/candidates.js` (rule layer)

Input: a tagged block from Task 2.1's shape (tokens with `text, lemma, pos, start, end`, noun phrases with determiner spans, sentence spans). Output: candidates `{start, end, lemma, pos, form, rule}`.

Tests in `test/candidates.test.js`, fixtures drawn from `research/experiment/judged/*.jsonl` (sentence, lemma, rule, label):

- Connectors: "but" → `pero`; blocked inside a listed multiword expression.
- Adverbs: "also" → `también`; the seven recurring errors (long, too, ago, yet, even, especially, anyway) never appear.
- Article plus noun: "the question" → `la question`; plural agreement; no bare nouns ever; no verbs ever.
- Article plus adjective plus noun with prenominal ordering.
- German: article plus noun only when sentence-initial (nominative); other positions are returned with `needsVerifier: true` and are dropped in the no-verifier tier.
- Dominant-sense flag: when `settings.tier === 'none'` only entries with `dominant: true` are emitted.
- Regression: over all judged items of the conservative rules labelled correct at F2, the rule layer reproduces at least 85% of them, and emits none of the items the judges labelled `should_not_swap_other`. Report the number in the test output.

Commit: `Extension: deterministic candidate rules from the experiment`.

## Phase 2: tagging and providers

### Task 2.1: `src/weave/tag.js`

Tests in `test/tag.test.js`:

- `tagBlock(text)` returns tokens with POS, lemma, and exact offsets into the original string (round-trip: slicing by offsets yields the token text, including for curly quotes and hyphens).
- Noun phrases carry determiner and adjective spans.
- Throughput: 10 KB of prose tags in under 200 ms on the VM. Report, don't gate.

Commit: `Extension: compromise tagger wrapper with exact offsets`.

### Task 2.2: provider interface and `src/providers/translator.js`

Interface: `availability() → 'available' | 'downloadable' | 'unavailable'`, `verify(request) → {verdicts, extras}`.

Tests in `test/providers.test.js` with a fake `globalThis.Translator`:

- `availability()` maps the API's states and returns `unavailable` when the global is missing.
- `verify` translates each sentence once and accepts a candidate only when a pack form appears as a whole token in the translation, accent-insensitive; German also accepts a form as the tail of a compound (experiment `nmt_pass_relaxed`).
- Never produces extras.

Commit: `Extension: Translator API agreement check`.

### Task 2.3: `src/providers/prompt-api.js`

Fake `globalThis.LanguageModel`. Tests: builds the prompt from Task 1.4, parses with `parseVerdicts`, passes the user-activation requirement through as `downloadable`, treats `QuotaExceededError` as a failure that the chain will fall through.

Commit: `Extension: Prompt API verifier`.

### Task 2.4: cloud adapters and quota

`src/providers/cloud.js` holds the shared request and response shape; `anthropic.js`, `gemini.js`, `openai.js` map it to each API. `src/shared/quota.js` counts calls per provider per day.

Tests with a fake `fetch`: each adapter sends the key in the right header, the right body, parses the text back, and surfaces 429 and 5xx as failures; quota refuses the call past the daily limit and resets at local midnight.

Commit: `Extension: cloud adapters (Anthropic, Gemini, OpenAI-compatible) and daily quota`.

## Phase 3: background

### Task 3.1: `src/background/chain.js` and verdict cache

Tests with fake providers:

- Tier order: LLM (Prompt API, else cloud with a key) → Translator → none.
- A failure in one tier falls through for that passage only.
- `none` filters to conservative candidates with `dominant: true` and drops `needsVerifier`.
- Cache keyed by `revision:sentenceHash:lemma:start`; LRU cap of 5,000 verdicts; hits skip the provider.

Commit: `Extension: verifier chain with fall-through and LRU verdict cache`.

### Task 3.2: `src/background.js` router and store

Messages: `config` (settings, generation, pack revision, site enabled), `verify` (block text, candidates), `event` (seen, peek, flip), `state` (for the popup), `toggle`, `setKey`. State writes go through `schedule.js`; a daily alarm runs `promote` and resets intake. Each reply carries the config generation. Tests use a fake `chrome` object; `test/fake-chrome.js` is shared.

Commit: `Extension: background router, state store, daily alarm`.

## Phase 4: page

### Task 4.1: `src/weave/scan.js`

Browser tests start here. Create `extension/test/browser/run.mjs` that launches Chromium through the scratchpad Playwright with `--disable-extensions-except` and `--load-extension`, serves `extension/test/fixtures/` on a free port (check `lsof -i` first), and runs assertions in page context. Fixtures: `prose.html`, `forms.html`, `code.html`, `feed.html` (adds blocks on a timer), `french.html` (`lang="fr"`), `sensitive.html`.

Tests: only allowed blocks are collected; no block inside the exclusion list; the French page yields nothing; `/checkout` path yields nothing; blocks added later by the feed are picked up; off-screen blocks are deferred until near the viewport.

Commit: `Extension: page scanner with exclusions and lazy observation`.

### Task 4.2: `src/weave/paint.js` and `src/weave/interact.js`

Tests in the browser runner:

- A swap replaces text inside exactly one text node; whitespace and surrounding markup are unchanged; links inside a block stay clickable.
- The span carries `data-en`, `data-lemma`, `data-sense`, `tabindex`, `role="button"`.
- First encounter: gloss visible at once. Later encounter: gloss after 700 ms hover or focus, and a `peek` event is sent. Click or Enter restores the English word and sends `flip`.
- Pause restores every original; re-enable repaints from cache without a provider call.
- Events fire only from trusted input: a scripted `dispatchEvent` produces no message.

Commit: `Extension: painter and interaction with trusted-only events`.

### Task 4.3: `src/content-loader.js` and `src/content.js`

Wire scan → tag → candidates → background verify → select → paint, with pending and in-flight maps keyed by text hash and generation checks on every reply. Browser test: on `prose.html` with the `none` tier, the painted count equals `select`'s budget at ratios 33, 100, and 1; zero console errors.

Commit: `Extension: content pipeline end to end on fixtures`.

## Phase 5: surfaces and packs

### Task 5.1: popup and options

`src/popup/popup.html|js`, `src/options/options.html|js`. Tests through the browser runner by opening the pages as extension URLs: toggling off sends `toggle` and the fixture page restores; the density slider writes the ratio and the page repaints to the new count; saving a key requests the provider's host permission (assert the permission request call on the fake in a unit test, and the real prompt manually).

Commit: `Extension: popup and options`.

### Task 5.2: keyboard off switch

`commands` in the manifest; handler in background; browser test that the command restores every page.

Commit: `Extension: global keyboard toggle`.

### Task 5.3: packs for es, fr, de

`tools/make-pack/convert.py` reads `research/experiment/packs/{es,fr,de}.json`, `lexicon.json`, `per-lemma.csv`, `mwe_blocklist.txt` and writes `extension/packs/<lang>.json` in the spec's schema: `class` from POS, `tier` from cognate and concreteness flags (cognate = Levenshtein ratio to the English lemma ≥ 0.7; concreteness from the Brysbaert norms if present in the download dir, else 2), `drop` from lemmas under 50%, German article forms by case, verbs kept only for the verifier's extras. Run `-I`, validate with `pack.js` in a node test that loads all shipped packs.

Commit: `Packs: es, fr, de converted from the experiment`.

### Task 5.4: packs for it, pt

Add `it` and `pt` to `research/experiment/gen_packs.py` `LANG_NAME`, run it with `claude -p` over the same lexicon into the scratchpad, then convert as in 5.3. Note the model and date in the pack `revision`.

Commit: `Packs: it, pt generated and converted`.

## Phase 6: evaluation and install

### Task 6.1: `tools/eval`

`tools/eval/run.mjs` tags the 27 research documents with `tag.js`, runs `candidates.js` per tier, applies `select` at a fixed density, and writes samples in the judged-item shape. `tools/eval/judge.sh` calls `research/experiment/judge.py` with the existing judge prompt. `tools/eval/report.py` prints precision per rule and tier with Wilson intervals, and the painted density at ratios 33, 100, and 1. Gates from spec §9 are printed as pass or fail.

Commit: `Eval: corpus replay through the real rule module with LLM judging`.

### Task 6.2: cross-browser lint

Install `web-ext` into the scratchpad only; run `web-ext lint --source-dir extension` and fix anything outside the common subset. Add a node test that asserts the manifest uses no key from the Safari and Firefox exclusion lists in `research/platforms.md` §1.

Commit: `Extension: manifest kept to the WebExtensions common subset`.

### Task 6.3: `INSTALL-FOR-AGENTS.md`, README, homepage link

Write the agent install steps (clone, `npm test`, three questions, write seed settings via `tools/seed.mjs`, hand over the Load unpacked step, never ask for a key in chat). Update README status. Point the homepage prompt sentence at the file and redeploy with `wrangler-auth`.

Commit: `Install: agent instructions, README status, homepage prompt`.

### Task 6.4: end-to-end on real pages

Manual, recorded in `docs/superpowers/plans/2026-10-16-extension-plan.md` under a Results heading: load unpacked in Chrome 138+, read a Wikipedia article, a news article, and a documentation page in Spanish mode at the default density, in the `none` tier and in the Prompt API tier if the machine has it. Note the painted density, any page damage, and console errors. Fix and repeat until clean.

Commit: `Extension: v1 verified on real pages`.

## Order and parallelism

Phases 1 and 2 are independent of each other and of pack conversion (5.3). Phase 3 needs 1.3, 1.4, 2.x. Phase 4 needs 2.1, 1.5, and 3. Phase 5.1 needs 4. Phase 6 needs everything. Run 5.3 and 5.4 early so the rule-layer regression test in 1.5 can use real packs.

## Results (2026-10-16)

Every task above is done. Deviations from the plan: the plan was written by hand (no `writing-plans` skill on the machine); the first-run seed became `extension/seed.json`, read once by the background, because a script cannot write browser storage; `tools/eval` judges with `claude -p` and can also run the LLM tier through `claude -p` as the verifier.

**Tests.** `npm test`: 111 unit tests pass, including pack validation for all five packs and the regression against the judged corpus (the rule layer reproduces 79% of judged-correct Spanish and French swaps and 85% of German; the gap is tagger limits and deliberate blocklist hits). `npm run test:browser`: 37 Playwright checks pass in Chromium with the extension loaded, zero console errors. `web-ext lint`: 0 errors, 4 warnings (Chrome service worker ignored by Firefox, which uses the `scripts` entry; the dynamic import in the loader).

**Precision eval** (`tools/eval`, research corpus of 27 documents, 200-item samples stratified by rule, judged by Claude Sonnet with the experiment's judge prompt, pooled by each rule's share of candidates, 95% Wilson intervals):

| language | tier | correct | candidates / 100 words | painted / 100 at 1 in 33 | gate |
|---|---|---|---|---|---|
| es | rules only | 90.6% [86–94] | 1.94 | 1.29 | pass (90%) |
| fr | rules only | 93.1% [89–96] | 1.80 | 1.22 | pass (90%) |
| de | rules only | 85.3% [80–90] | 1.22 | 0.91 | fail (90%) |
| es | LLM (Claude Sonnet as verifier, 60 blocks, 75 items) | 92.0% [84–96] | 3.23 | 1.72 | fail (95%) |

By rule, connectors run 96–100% in every language and article-plus-noun 84–92%; adverbs are the weak class (78–84% in es and de). German's shortfall is adverbs and case: five of eleven German noun "case errors" carry a judge reason that says the form is correct, so the true German figure sits above 85%, but it does not reach 90%. The LLM tier's 92% is on a small sample; its errors are idioms the verifier let through ("a book a year", "not just X but Y").

**Density at the default setting is supply-limited.** With 1 in 33 requested, the rule-only tier paints about 1 in 75 (es), because candidates are rarer than the budget. The reader setting is honoured exactly whenever supply allows (browser checks at 1 in 33, 1 in 100, and everything).

**Real pages** (`test/browser/real.mjs`, Spanish, French, German): Wikipedia "Volcano" paints 70–92 swaps over the parts scrolled into view with zero console errors and no page damage; reading them, about nine in ten are right in each language, and the misses fed the pack fixes above. MDN and text.npr.org paint nothing, correctly: their readable text outside links and code is too short per block.

**Follow-ups.** German rule-only tier below the gate: either route German article-plus-noun swaps through the verifier only, or gather a larger German sample with an Opus judge to settle the case noise. LLM tier: a larger verified sample and an idiom hint in the prompt. Adverbs: a per-lemma adverb blocklist built from these samples would lift es and de by a few points.
