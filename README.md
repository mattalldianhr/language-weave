# Language Weave

A browser extension that swaps a few English words on any web page for the same words in a language you are
learning. You read what you were going to read anyway. Hover a swapped word for the English; click to flip it
back. Swaps are rare, placed where the sentence already gives the meaning away, and each word comes back on
later days until it sticks.

Spanish, French, German, Italian and Portuguese to start.

**Status (October 2026):** research and design are done; the extension is not built yet. What exists today is
the homepage (which demonstrates the method on its own copy) and the evidence behind the design.

## Why build it from first principles

The inspiration is [French Weave](https://github.com/jackieoliver/french-weave) by Jackie Oliver and
[a 2009 post by Tim Ferriss](https://tim.blog/2009/01/20/learning-language/) on learning the most common words
first. The method itself is the *diglot weave*, proposed by Robbins Burling in 1968. Rather than copy the
inspirations, this project measured the premises:

- **Which words.** The 100 most common English words cover 46% of web text, but they are almost all grammar
  words you cannot swap in place. A useful list starts around 300 words and is mostly nouns and connectors.
  Ferriss's list is Edward Fry's 1980 "Instant Words", from a 1971 corpus of school texts.
  → `research/coverage-report.md`
- **How often and how many.** Keep foreign words under 1 in 20 of the text, nearer 1 in 50, so comprehension
  stays above 95%. A word needs about 8–12 spaced meetings before it stays; fewer than 8 and nothing was
  recalled three months later. Nouns should arrive with their article. → `research/literature.md`
- **What goes wrong elsewhere.** Wrong-sense swaps are the number-one complaint across every word-swap
  product; every paid one is dormant. → `research/landscape.md`
- **Can rules alone do it?** No. A deterministic swapper (part-of-speech tagging plus a sense whitelist) reaches
  90–92% correct at about 2 swaps per 100 words, 94–97% with an on-device translation check, and never 97% at
  3 or more per 100. The remaining errors are senses and idioms, not case or conjugation.
  → `research/experiment-deterministic.md`
- **Where else it could live.** Safari (macOS and iOS) and Firefox for Android are packaging work if the core
  avoids native messaging; iOS system-wide is impossible; a native reader app is viable with Apple's on-device
  models. → `research/platforms.md`

## The design that follows

1. **Deterministic candidate layer** in the browser: a small POS tagger, per-language word packs, and narrow
   rules (connectors, article-bearing nouns, filtered adverbs). Works everywhere, offline, no key.
2. **Pluggable verifier** that confirms sense in context and admits the classes rules cannot: Chrome's on-device
   Translator and Prompt APIs first; a cloud key (Anthropic, Gemini, or any OpenAI-compatible endpoint) only
   if the user adds one, and then only sentence fragments are sent.
3. **Progression** by counted, spaced encounters (not days seen), with the gloss shown instantly on a word's
   first meeting and after a short retrieval pause from the second.
4. **Portable by construction**: the WebExtensions common subset, state in extension storage, no native host.

## Repository layout

```
site/        the homepage (static; deploys as-is)
research/    coverage data, literature review, product landscape, platform feasibility,
             and the precision experiment, with every script and judged sample
design/      the content brief and the two unchosen homepage drafts
```

### Reproducing the research

- Coverage curves and exposure counts: `bash research/run_all.sh <download-dir> <venv-dir>`
  (downloads OpenSubtitles frequency lists and installs `wordfreq`; see `research/coverage-report.md`).
- The precision experiment: `research/experiment/RUN.md` lists every command. Pack generation and judging
  use `claude -p`; the NMT check uses Marian `opus-mt` models on CPU.

All Python runs with `python3 -I` and takes data paths as arguments; nothing executes from a download directory.

## Homepage

`site/index.html` is a single self-contained file. Its own copy carries woven words in five languages: hover
for the English, click to flip, switch the language in the wall sign. Open it directly in a browser, or deploy
the `site/` directory to any static host.

## License

MIT. See `LICENSE`.
