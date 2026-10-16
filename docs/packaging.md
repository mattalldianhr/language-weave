# Packaging for Firefox and Safari

The extension is written to the WebExtensions common subset (see `research/platforms.md` §1 and the
manifest test in `extension/test/manifest.test.js`), so neither browser needs a code fork. What each
needs is a package and a review.

## Firefox (desktop and Android)

The manifest already carries `browser_specific_settings.gecko` with an add-on id, a minimum version,
and the data-collection declaration (`none`). Firefox ignores `background.service_worker` and uses the
`background.scripts` entry; both point at the same module.

```sh
cd extension
npm run lint:firefox      # web-ext lint, must report 0 errors
npm run build:firefox     # writes dist/language-weave-<version>.zip
```

Load it for a look: `about:debugging` → This Firefox → Load Temporary Add-on → pick `manifest.json`.
Or run it headlessly against the fixture pages, which prints the swap count the page itself reports:

```sh
npm run smoke:firefox     # needs a Firefox binary; set FIREFOX_BIN if it is not on PATH
```

Publish on AMO (addons.mozilla.org): upload the zip as a new listed add-on, choose "Firefox and
Firefox for Android", and attach the source zip (`git archive`). AMO reviews unlisted builds in minutes
and listed ones in days. Firefox for Android needs no extra packaging; the popup opens as an overlay
and the keyboard command is simply absent there.

What to expect on Firefox: no on-device Translator or Prompt API, so the tiers are a cloud key or the
rules. Storage works the same; `storage.local.setAccessLevel` does not exist and is skipped.

## Safari (macOS, iOS, iPadOS)

Safari wraps a web extension in an app. Two routes:

1. **App Store Connect web packager** (no Mac needed to package): zip the `extension/` folder,
   upload it in App Store Connect under "Web extension", and Apple builds the containing app for macOS
   and iOS. Requires the Apple Developer Program.
2. **Xcode** on a Mac: `xcrun safari-web-extension-converter extension --project-location build/safari
   --app-name "Language Weave" --bundle-identifier dev.pages.language-weave`, then build and run.

Both read the same manifest. Points that matter for Safari, all already handled in the code:

- No hover on iOS: a first tap shows the gloss and counts as a peek, a second tap flips. Covered by
  the touch section of `npm run test:browser`.
- Per-site permission prompts: Safari asks the first time the extension touches a site; the content
  script does nothing until then.
- `storage.sync` is not used anywhere; `storage.local` is.
- The background runs as a service worker on macOS 14+ and iOS 17+, and as a non-persistent page on
  older versions; the module has no state outside storage either way.
- No Translator or Prompt API; the tiers are a cloud key or the rules.

Review guideline 4.4.2 asks why an extension needs access to all sites. The answer is the product: it
rewrites text on pages the reader is already reading, never collects it, and the privacy text in the
options page states exactly what leaves the device and when.

## Before shipping either

- `npm test` and `npm run test:browser` green.
- Bump `version` in `extension/manifest.json` and `extension/package.json`.
- Note the eval numbers for the release in `docs/superpowers/plans/2026-10-16-extension-plan.md`.
