# Installing Language Weave (instructions for a coding agent)

You are setting up Language Weave for the person you are working with. Run every command yourself; the
person only does the steps marked HUMAN. Never ask for, print, or store an API key in chat.

`<repo>` is what the person gave you: a GitHub `owner/name`, a git URL, or a local folder path. The canonical
repo is `github.com/mattalldianhr/language-weave`.

## 0. Ask three questions in one message, then start

Send the human steps and the questions together. Anyone who skips a question gets the default.

> Setting up Language Weave. Three quick questions below; I'll do the rest, except one step Chrome reserves
> for you: at the end, open `chrome://extensions`, switch on **Developer mode**, click **Load unpacked**, and
> pick the folder I give you.
>
> 1. Which language? Spanish (default), French, German, Italian, Portuguese.
> 2. How much do you know already? None (default) / a few basic words / I can read simple text.
> 3. Do you want a cloud model to check swaps? No, use what the browser has (default) / Yes, I'll paste a key
>    into the extension's Settings page myself.

| Answer | Effect |
| --- | --- |
| 1. language | `--lang es` / `fr` / `de` / `it` / `pt` |
| 2. none / basic / simple | `--known 0` / `--known 40` / `--known 150` |
| 3. yes | mention the Settings page in the hand-over; the key goes there, never through you |

## 1. Check prerequisites

```sh
node --version   # 20 or newer
git --version
```

Nothing else is needed: no npm install, no build step, no Python.

## 2. Get the code and run the tests

```sh
git clone https://github.com/<repo>.git language-weave   # or copy the local folder
cd language-weave/extension && npm test
```

Expect every test to pass. If any fail, stop and show the output; do not continue.

## 3. Write the first-run seed

```sh
cd language-weave && node tools/seed.mjs --lang <lang> --known <n>
```

This writes `extension/seed.json`. The extension reads it once on its first run and then ignores it. It sets
the language, marks the most common words as already known, and leaves the density at the default
(1 word in 33), which the person can change in the popup at any time.

## 4. Hand over (HUMAN)

Tell the person, with the real absolute path filled in:

> Open `chrome://extensions`, turn on **Developer mode** (top right), click **Load unpacked**, and choose
> `<absolute path>/language-weave/extension`. Then open any article. Swapped words are violet: hover for the
> meaning, click to put the English back. The toolbar icon turns it off everywhere or on one site, and sets
> how dense the swaps are. Alt+Shift+W turns it off from the keyboard.

If they use Firefox instead of Chrome:

> Open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and choose
> `<absolute path>/language-weave/extension/manifest.json`. Firefox forgets temporary add-ons when it
> closes; a signed build for keeps is described in `docs/packaging.md`.

If they answered yes to a cloud model:

> In the extension's **Settings** (link at the bottom of the popup), choose the provider, paste the key, and
> click **Save key**. Chrome will ask once for access to that provider's address. The key stays on this
> device.

## 5. Verify

Ask them to open an article and read the line under "Checking swaps with" in the popup. It says which
checker is in use: a language model, the browser translator, or the word rules only. All three are fine;
the word rules alone were right about nine times in ten in testing, and the others raise that.

## Updating later

```sh
cd language-weave && git pull && cd extension && npm test
```

Then `chrome://extensions` → the reload icon on Language Weave. Progress and settings are kept; the seed
file is not re-applied.
