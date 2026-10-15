# Language Weave: platform feasibility beyond the Chrome extension

Date: 2026-10-15 (America/New_York). Baseline: the Chrome MV3 extension (french-weave model: lexicon CSV, Gemini on the user's key, content script swaps words, hover for meaning, click to flip back, exposure-based learning state).

Confidence legend: **high** = read in primary documentation or vendor page; **medium** = vendor page partially read, or consistent secondary sources; **low** = could not verify, stated from reasoning or stale sources.

---

## 1. Feasibility matrix

| Approach | Feasible? | What it can touch | What breaks | Permissions and policy risk | Distribution cost | Code shared with Chrome ext | On-device model available |
|---|---|---|---|---|---|---|---|
| Safari web ext, macOS | Yes (high) | Any web page in Safari | `webRequestBlocking`, `identity`, `update_url`; `storage.sync` does not sync; native messaging only to the containing app | Per-site permission prompts; App Store review; Guideline 4.4.2 limits site access claims | $99/yr Apple Developer Program; App Store review or Developer ID | ~90% | None in Safari JS. Containing app can call Foundation Models on macOS 26+ (medium) |
| Safari web ext, iOS/iPadOS | Yes (high) | Any web page in Safari on iPhone/iPad | No `contextMenus`, no `windows.create`, no `webRequest`; app-to-JS messaging; background worker lifetime reports (low); no hover | Same prompts via "More" menu; App Store review mandatory | $99/yr; App Store review; TestFlight for beta | ~85% | None in Safari JS. Containing app can call Foundation Models on iOS 26+ (medium) |
| Firefox for Android ext | Yes (high) | Any web page in Firefox for Android | No background service worker (use event page); no menus, windows, commands, sidebar, native messaging; popup opens as overlay | AMO review; no Apple-style gate | Free; AMO listing | ~80% | None |
| macOS accessibility overlay | Yes, fragile (medium) | Cocoa text views; Chromium/Electron apps after enabling AX; PDF viewers unverified | Apps without AX text ranges; scrolling/relayout drift; Electron AX off by default | Accessibility (TCC) prompt; **not allowed in Mac App Store** (sandbox forbids AX use) | $99/yr; Developer ID + notarization only | ~15% | Foundation Models (macOS 26+, M1+); Translation; NLTagger |
| macOS OCR overlay | Yes, lossy (medium) | Any pixels on screen | No DOM/text semantics; word boxes approximate; re-OCR on every scroll; monthly screen-recording re-approval on Sequoia (medium) | Screen Recording permission; sandbox does not list screen capture as forbidden (medium) | $99/yr; possibly Mac App Store (unverified) | ~10% | Vision OCR (macOS 10.15+); Foundation Models |
| iOS system-wide | **No** (high) | Nothing outside your own process | No extension point reads or draws over other apps' text | n/a | n/a | 0% | n/a |
| Android accessibility overlay | Yes (high) | Text nodes with bounds in any app; per-character bounds for views that support it; overlay windows | WebView/Compose/Flutter character bounds unverified; sideloaded builds blocked by Restricted Settings | AccessibilityService policy: prominent disclosure + consent + Play Console declaration + video; cannot claim `isAccessibilityTool` | Free Play account ($25 one-time, not re-verified); policy review | ~15% | ML Kit GenAI Prompt API (Beta, device list); ML Kit Translation |
| Native reader app (iOS/macOS/Android) | Yes (high) | Content you render: URLs via share sheet, RSS, newsletters, EPUB, PDF | Cannot read Apple Books or Kindle content; must build import pipeline | Standard app review; no special permissions | $99/yr Apple; Play fee | ~60% if content is rendered in WKWebView/WebView and the content script is reused; ~30% otherwise | Foundation Models / Translation / NLTagger on Apple; ML Kit on Android |

---

## 2. Findings per hypothesis

### A1. Safari Web Extensions on macOS and iOS/iPadOS

**Conversion tool.** Apple renamed the tool. The command is `xcrun safari-web-extension-packager /path/to/extension`. Apple's page says: "This tool used to be named `safari-web-extension-converter`." Options include `--ios-only`, `--macos-only`, `--rebuild-project` (add iOS to an existing macOS project), and `--copy-resources`. The packager prints warnings for unsupported manifest keys. Confidence: high. Source: https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari

**No Mac required.** A web-based packager now exists in App Store Connect: "Upload and distribute Safari Web Extensions without using a Mac or Xcode." It builds macOS and iOS apps, then TestFlight or App Store submission follows. Packaging time is deducted from the 25 Xcode Cloud hours included in the membership. Confidence: high. Source: https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect

**MV3 support.** "Safari 15.4 and later supports manifest versions 2 and 3." MDN browser-compat-data lists `background.service_worker` as supported from Safari 15.4 and Safari on iOS 15.4. Apple: "In iOS, you need to set the `persistent` attribute to `false`. With manifest version 3, all background pages are nonpersistent." Confidence: high. Sources: https://developer.apple.com/documentation/safariservices/assessing-your-safari-web-extension-s-browser-compatibility ; https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/manifest/background.json

**API gaps relevant to the Chrome extension** (all from Apple's compatibility page unless noted; high):
- `scripting.registerContentScripts` and friends: "supported in Safari 16.4 or later." `scripting.executeScript`: "`injectImmediately` not supported."
- `storage`: "Local storage limit is 5 MB." `unlimitedStorage` grants unlimited storage in Safari 16+. `storage.session` needs Safari 16.4+. `storage.sync`: "syncing not supported."
- `alarms`: Safari 14, Safari iOS 15 (MDN BCD). Source: https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/api/alarms.json
- `optional_host_permissions`: Safari 15.5, MV3 only (MDN BCD). Source: https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/manifest/optional_host_permissions.json
- Both `chrome.*` and `browser.*` namespaces work; callbacks and Promises both work.
- Not supported: `identity`, `update_url` ("Handle Safari web extension updates with the App Store"), `webRequestBlocking`, `tabs.move`. iOS only: no `contextMenus`/`menus`, no `webRequest`, no `windows.create/remove/update`.
- `fetch` to a cloud API from the background script: nothing in Apple's page restricts it. Host permissions and CORS apply as in Chrome. Confidence: medium (absence of restriction, not a positive statement).

**Native messaging.** It exists on both platforms but differs from Chrome. `browser.runtime.sendNativeMessage` goes only to the containing app's native extension handler (`SafariWebExtensionHandler.beginRequest`). "Safari ignores the `application.id` parameter." Content scripts cannot call it. App-to-JS messaging (`connectNative` port) works on macOS only: "You can't send messages from a containing iOS app to your web extension's JavaScript scripts." The french-weave Python native host would not carry over; its role moves into the Swift handler. Confidence: high. Source: https://developer.apple.com/documentation/safariservices/messaging-between-the-app-and-javascript-in-a-safari-web-extension

**Background service worker lifetime on iOS.** Apple does not document it. Developer forum reports from 2024 describe workers killed on iOS 17.4 to 17.6 and not revived until the extension was toggled, with keep-alive port workarounds. Current iOS 27 behavior is unverified. Confidence: low. Source: https://developer.apple.com/forums/thread/758346

**Permissions UX.** Safari badges the extension until the user grants access. On macOS the user picks "a single use, for the day, or for all websites." On iOS the user opens the extension in the More menu and picks an option. Settings > Safari > Extensions manages per-site Ask/Allow/Deny. Apple's guidance: "only use `<all_urls>` if there is no other option." Confidence: high. Source: https://developer.apple.com/documentation/safariservices/managing-safari-web-extension-permissions

**Distribution and cost.** Apple Developer Program: "99 USD per membership year." App Store review applies; TestFlight for beta. App Store Review Guideline 4.4.2: "Safari extensions should not claim access to more websites than strictly necessary to function." Guideline 4.4 forbids in-app purchases inside the extension itself. The french-weave default "on for every site" needs a justification or an opt-in model. Confidence: high. Sources: https://developer.apple.com/programs/enroll/ ; https://developer.apple.com/app-store/review/guidelines/

**UX differences.** iPhone has no hover. The "hover for meaning, click to flip" interaction needs a tap model. Confidence: high (product reasoning, not a doc claim).

### A2. Firefox for Android and other mobile browsers

**Firefox for Android runs open extensions.** Mozilla launched the open ecosystem on December 14, 2023: "More than 450 Firefox for Android extensions are now discoverable on the addons.mozilla.org (AMO) Android homepage." Any AMO-listed extension can declare Android compatibility with `browser_specific_settings.gecko_android`. Confidence: high. Sources: https://blog.mozilla.org/addons/2023/12/14/a-new-world-of-open-extensions-on-firefox-for-android-has-arrived/ ; https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/

**MV3 status on Android.** Extension Workshop: "Background service workers aren't supported on Firefox for Android." It recommends event pages and says: "it's recommended you use Manifest V2 for extensions targeting Firefox for Android." MDN BCD lists `service_worker` as not supported in Firefox at all. An MV3 manifest with `background.scripts` plus `persistent: false` is the portable shape. Confidence: high. Sources: same as above; https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/manifest/background.json

**Other Android differences** (Extension Workshop; high): no `menus`, `commands`, `windows`, sidebars, `bookmarks`, `history`, `sessions`, devtools; `runtime.connectNative` and `sendNativeMessage` unavailable; popups "open as an overlay, covering the browser window"; storage local/session/sync work but sync does not sync to the Mozilla account; "Users can't edit an extension's host permission grants in Add-ons Manager on Firefox for Android." Source: https://extensionworkshop.com/documentation/develop/differences-between-desktop-and-android-extensions/

**Chromium-based Android browsers.**
- Kiwi Browser: archived January 2025; its extension code moved to Edge Canary. Confidence: medium (press). Source: https://www.androidauthority.com/kiwi-browser-shutting-down-3519510
- Microsoft Edge for Android: extensions reached stable in March 2025 with a curated list of roughly 20 (Dark Reader, Bitwarden, Tampermonkey, Keepa). No open install path was reported. 2026 status not found. Confidence: medium. Source: https://www.androidauthority.com/microsoft-edge-extensions-android-3535402
- Samsung Internet: content blockers through the browser menu, plus a curated Galaxy Store add-on list. Not an open ecosystem. Confidence: medium. Source: https://developer.samsung.com/internet/android/overview.html
- Chrome for Android: no extensions in the consumer app as of mid-2026. Extension loading appeared only in experimental "Desktop Android" builds. Confidence: medium (press; no Google announcement found). Source: https://chromeunboxed.com/a-development-version-of-chrome-for-android-now-supports-extensions
- Chrome for iOS: no extension API. Every iOS browser must use WebKit (Guideline 2.5.6: "Apps that browse the web must use the appropriate WebKit framework"). Safari Web Extensions are the only browser extension path on iPhone. Confidence: high for the WebKit rule; medium for the absence (no Google page found). Source: https://developer.apple.com/app-store/review/guidelines/

### B3. macOS system-wide: reading and overlaying other apps' text

**(a) Accessibility API.** `kAXBoundsForRangeParameterizedAttribute` returns "The bounding rectangle of the text associated with this accessibility object that is specified by the given range. This is the bounding rectangle a sighted user would see on the display screen, in pixels." Available since macOS 10.3. With `kAXValueAttribute` text plus this attribute, an app can locate each word on screen. Confidence: high for the API. Source: https://developer.apple.com/tutorials/data/documentation/applicationservices/kaxboundsforrangeparameterizedattribute.json

- Cocoa text views: AppKit text views implement the AX static-text protocol with frame-for-range. Confidence: medium (not re-read for this report). Reference: https://developer.apple.com/documentation/appkit/nsaccessibilitystatictext
- Chromium and Electron: the accessibility tree is off until assistive technology is detected. Chromium "turns on or off accessibility support based on whether it sees a client, such as VoiceOver" that "has set the AXEnhancedUserInterface attribute on the main application window." Electron adds a supported switch: set `AXManualAccessibility` on the app's `AXUIElement`. Whether Chromium answers word-level `BoundsForRange` correctly was not verified. Confidence: high for activation; low for word bounds. Sources: https://www.chromium.org/developers/design-documents/accessibility/ ; https://www.electronjs.org/docs/latest/tutorial/accessibility
- PDF viewers (Preview, Chrome PDF viewer): not verified. Confidence: low.
- Permission: the Accessibility privacy prompt (`AXIsProcessTrustedWithOptions`). Confidence: high. Reference: https://developer.apple.com/documentation/applicationservices/1459186-axisprocesstrustedwithoptions
- Mac App Store: App Sandbox forbids "Use of accessibility APIs in assistive apps," and Guideline 2.4.5(i) requires sandboxing for Mac App Store apps. An AX-based overlay must ship as Developer ID outside the store. Confidence: high. Sources: https://developer.apple.com/documentation/security/protecting-user-data-with-app-sandbox ; https://developer.apple.com/app-store/review/guidelines/
- Fragility: text positions change on scroll, resize, and relayout. The app must observe AX notifications and redraw. No vendor doc quantifies this. Confidence: medium (reasoning).

**(b) Overlay windows.** `NSWindow.ignoresMouseEvents` makes a window "transparent to mouse events." A borderless window at a raised level draws labels over word rectangles. Confidence: high for the API. Source: https://developer.apple.com/documentation/appkit/nswindow/ignoresmouseevents

Existing apps:
- Grammarly for Mac: "Grammarly needs access to accessibility features on your Mac. Without this access, our product will not be able to provide writing assistance." It underlines problems inside other apps' text fields and shows a floating widget. Grammarly does not publish its mechanism. Confidence: medium that it is AX-driven. Source: https://support.grammarly.com/hc/en-us/articles/360059770451-Why-does-Grammarly-need-access-to-accessibility-features
- Easydict (open source): "requires Accessibility for word selection and Screen Recording for OCR." Results appear in its own popup window, not in place. Confidence: high. Source: https://github.com/tisfeng/Easydict
- Bob: screenshot OCR and selection translation in a popup; closed source. Confidence: medium. Source: https://bobtranslate.com
- Immersive Translate on Mac: a Safari extension (App Store, macOS 12+) and a desktop beta for audio captions. No system-wide text overlay product was found. Confidence: high. Sources: https://apps.apple.com/app/immersive-translate/id6447957425 ; https://immersivetranslate.com/web-live-captions/
- No shipping Mac app was found that replaces words in place across arbitrary apps. Grammarly's underline-plus-widget is the closest precedent. Confidence: medium.

**(c) Screen capture + Vision OCR + overlay.** `CGRequestScreenCaptureAccess()` (macOS 10.15+) prompts for Screen Recording. `VNRecognizeTextRequest` (macOS 10.15+) returns `VNRecognizedTextObservation` results with bounding boxes; `supportedRecognitionLanguages()` lists languages. Confidence: high. Sources: https://developer.apple.com/documentation/coregraphics/cgrequestscreencaptureaccess() ; https://developer.apple.com/documentation/vision/vnrecognizetextrequest

- Fragility: OCR gives pixels, not semantics. Every scroll needs a re-capture and re-OCR. Word boxes are approximate. Overlaying a replacement label over a word hides the original pixels but cannot reflow the line.
- macOS Sequoia added recurring Screen Recording re-approval ("Allow For One Month"). Apple tied the alerts to deprecated capture APIs and pointed to ScreenCaptureKit and `SCContentSharingPicker`. Confidence: medium (press). Source: https://9to5mac.com/2024/10/07/macos-sequoia-screen-recording-popups/
- Mac App Store: screen capture is not on the sandbox's forbidden list. Eligibility was not verified. Confidence: low.

### B4. iOS: no supported way to touch other apps' text

Apple's extension point list contains no point that reads or draws over another app's content. Custom keyboards are the closest and are input-only: "Custom keyboards run in an isolated process that doesn't have direct access to the text input view." They work through `textDocumentProxy`. Guideline 2.5.1 limits apps to public APIs. Confidence: high (absence of an API in Apple's own list). Sources: https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/index.html ; https://developer.apple.com/documentation/uikit/creating-a-custom-keyboard ; https://developer.apple.com/app-store/review/guidelines/

What is possible on iOS (all high):
- Safari Web Extension (iOS 15+): the only in-browser path. See A1.
- Share extension: "Post to a sharing website or share content with others." Receives a URL or text from any app. Source: ExtensibilityPG above.
- Action extension: "Manipulate or view content originating in a host app." Can show a view over the host app's shared content, not the host app's own screen.
- Custom keyboard: input side only; `RequestsOpenAccess` needed for network. Source: creating-a-custom-keyboard above.
- VisionKit `ImageAnalyzer` (iOS 16+): Live Text on images or screenshots inside your app; `supportedTextRecognitionLanguages`. Source: https://developer.apple.com/documentation/visionkit/imageanalyzer
- App Intents (iOS 16+): exposes actions to Siri, Spotlight, Shortcuts, Action button. A "Weave this text" intent can accept text from Shortcuts. Source: https://developer.apple.com/documentation/appintents

### B5. Android: AccessibilityService plus overlays

**Reading text with bounds.** A service that declares `canRetrieveWindowContent` can call `getRootInActiveWindow()` (API 16) and `getWindows()` (API 21) to walk `AccessibilityNodeInfo` trees. `getText()` (API 14) and `getBoundsInScreen(Rect)` (API 14) give node text and screen rectangles. Per-character rectangles exist: `refreshWithExtraData(EXTRA_DATA_TEXT_CHARACTER_LOCATION_KEY, args)` (API 26) returns an array of `RectF`, with `EXTRA_DATA_TEXT_CHARACTER_LOCATION_ARG_MAX_LENGTH` = 20000 (API 31). Window-coordinate variant added in API 36. `takeScreenshot` (API 30) exists for an OCR fallback. Confidence: high. Sources: https://developer.android.com/reference/android/view/accessibility/AccessibilityNodeInfo ; https://developer.android.com/reference/android/accessibilityservice/AccessibilityService

Caveat: character locations come from the view's own implementation. `TextView` provides them. Coverage in WebView, Jetpack Compose, and Flutter was not verified. Confidence: low for those toolkits.

**Drawing overlays.** The AccessibilityService docs: "Accessibility services can draw overlays on top of existing screen contents." Overlays attach to a window (`attachAccessibilityOverlayToWindow`, API 34) or the display (`attachAccessibilityOverlayToDisplay`, API 34). Window type `TYPE_ACCESSIBILITY_OVERLAY`: "Windows that are overlaid only by a connected AccessibilityService for interception of user interactions without changing the windows an accessibility service can introspect." Non-service apps use `TYPE_APPLICATION_OVERLAY` with `SYSTEM_ALERT_WINDOW`. Confidence: high. Sources: https://developer.android.com/reference/android/accessibilityservice/AccessibilityService ; https://developer.android.com/reference/android/view/WindowManager.LayoutParams

**Existing apps.** Play listings confirm the pattern: ScreenTranslate (com.lomoware.screen_translate) "uses Android's Accessibility Service only to detect on-screen text and scrolling so it can translate automatically." Screen Translate AI OCR (com.screen.translate.google) requests Accessibility and overlay permissions and says the service reads on-screen text for translation only. Instant Translate On Screen (Sapiens Labs) uses a floating bubble plus the Accessibility Service API. Google's own Tap to Translate is different: it triggers on copy, needs "Display over other apps," and "works with text, not with images." It does not read the screen. Confidence: high. Sources: https://play.google.com/store/apps/details?id=com.lomoware.screen_translate ; https://play.google.com/store/apps/details?id=com.screen.translate.google ; https://support.google.com/translate/answer/6350658

**Google Play policy.** Only tools "designed to help people with disabilities" may set `isAccessibilityTool`. Named non-eligible categories: antivirus, automation tools, assistants, monitoring apps, cleaners, password managers, launchers. A language-learning overlay cannot claim the flag. It can still use the API if it shows a prominent in-app disclosure that describes the accessed data, requires affirmative consent, is separate from other disclosures, and is backed by a Play Console declaration with a video of the consent flow. "Autonomously initiate, plan, and execute actions" is prohibited; a read-and-overlay feature does not do that. Translation is not mentioned as a permitted or forbidden use. Confidence: high. Source: https://support.google.com/googleplay/android-developer/answer/10964491

Rejection risk: moderate. Shipping screen-translate apps show the use case is tolerated with disclosure. Risk rises if the overlay also taps or scrolls on the user's behalf. Confidence: medium.

**Restricted Settings.** Android 13+ blocks enabling accessibility for apps installed outside a trusted store until the user taps "Allow restricted settings" in app info. Play-installed builds are unaffected; sideloaded test builds need the extra step. Confidence: high. Source: https://support.google.com/android/answer/12623953

### C6. A reader app instead of a system overlay

- **Pocket**: Mozilla announced on May 22, 2025 that Pocket shut down on July 8, 2025, with exports allowed until October 8, 2025. Confidence: medium (press; Mozilla's own notice not fetched). Sources: https://9to5mac.com/2025/05/22/mozilla-announces-shutdown-of-pocket/ ; https://cyberinsider.com/mozilla-to-shut-down-pocket-service-in-july-to-allow-exports-until-october/
- **Omnivore**: the hosted service was "deprecated in November of 2024"; "Omnivore is now a completely Self-Hosted application." Confidence: high. Source: https://github.com/omnivore-app/omnivore
- **Readwise Reader**: public API v3. `POST /api/v3/save/` takes a URL and optional HTML. `GET /api/v3/list/` with `withHtmlContent=true` returns each document's HTML. Updates change metadata only; no endpoint edits a document's HTML body. Rate limits: 50/min for save and update, 20/min for list. A weave pipeline could pull HTML out of Reader and render it elsewhere, but cannot push swaps back in. Confidence: high. Source: https://readwise.io/reader_api
- **Instapaper**: a documented API exists, but the page is JS-rendered and could not be scraped. Confidence: low. Source: https://www.instapaper.com/api
- **Matter**: iOS and web only; a third-party directory claims an API for Pro subscribers. Confidence: low. Source: https://apis.io/providers/matter/
- **LingQ**: API v2 documents `POST /api/v2/{language_code}/lessons/` with `title`, `text`, `original_url`, and `GET /api/v2/{language_code}/cards/` (LingQs with a `status` field). No documented endpoint sets word status or known words. Import is text-in, not swaps-in. Confidence: high for what is documented. Source: https://www.lingq.com/apidocs/api-2.0.html
- **Readlang**: Web Reader extension or bookmarklet, Readability-based import, click-to-translate with saved words. No public API found. Confidence: medium. Source: https://blog.readlang.com/2015/12/10/import-clean-readable-versions-of-webpages-to-practice-language-learning.html
- **Kindle Word Wise**: Amazon's help page still documents it. Word Wise "is only available in books in English" and is listed for Kindle e-readers, Fire tablets, and Kindle for Android. The page returned 403 to fetches; wording comes from search excerpts. No hook for third parties. Confidence: medium. Source: https://www.amazon.com/gp/help/customer/display.html?nodeId=201645250
- **Immersive Translate**: browser extension for Chrome, Edge, Safari, Firefox; App Store app for iPhone, iPad, Mac, and Vision with a Safari extension; "One-click export of bilingual e-books, with support for real-time translation of PDF." In-app prices: Monthly Pro $9.99, Annual Pro $79.99, Max $34.99/month, $289.99/year. No extension point for third-party word logic was found. Confidence: high for platforms and prices; medium for the absence of a plugin API. Sources: https://apps.apple.com/app/immersive-translate/id6447957425 ; https://immersivetranslate.com/pricing/
- **Apple Books and Kindle content from a third-party iOS app**: no public framework exists in Apple's documentation, and Apple Books purchases use FairPlay DRM. Kindle has no third-party content API. This is an absence finding. Confidence: low (no primary source states the negative).

Implication: the reader model works only for content the app fetches itself (share-sheet URLs with Readability extraction, RSS, newsletters, user-supplied EPUB and PDF). If the app renders that content in a `WKWebView` or Android `WebView`, the Chrome content script can run inside it with small changes.

### D7. Apple on-device intelligence

- **Foundation Models framework shipped.** iOS 27, iPadOS 27, macOS 27, and visionOS 27 were released September 14, 2026, and the framework docs now cover on-device, Private Cloud Compute, multimodal prompts, dynamic profiles, and a `LanguageModel` protocol for third-party models. Confidence: high. Sources: https://www.apple.com/newsroom/2026/09/major-updates-for-apples-software-platforms-are-now-available/ ; https://developer.apple.com/documentation/foundationmodels
- **Devices.** Apple's support page: iPhone 15 Pro and Pro Max, iPhone 16 models or later, iPhone Air, iPad mini (A17 Pro), iPad with M1 or later, Mac with M1 or later (and MacBook Neo with A18 Pro), Apple Vision Pro. Device and Siri language must match a supported language. Confidence: high. Source: https://support.apple.com/en-us/121115
- **Languages.** English, Danish, Dutch, French, German, Italian, Norwegian, Portuguese, Spanish, Swedish, Turkish, Vietnamese, Chinese (simplified and traditional), Japanese, Korean. The model "understands and generates text in any language that Apple Intelligence supports." Check at runtime with `SystemLanguageModel.default.supportsLocale()` and `supportedLanguages`. Confidence: high. Sources: https://support.apple.com/en-us/121115 ; https://developer.apple.com/documentation/foundationmodels/supporting-languages-and-locales-with-foundation-models
- **Context window.** "Apple's on-device foundation model has a context window of 4096 tokens per session." Input and output share it. `contextSize` and `tokenCount(for:)` are available. Exceeding it throws `LanguageModelError.contextSizeExceeded`. Private Cloud Compute offers "a larger context window and stronger reasoning"; the exact size is not stated on the pages read. Confidence: high for 4096. Source: https://developer.apple.com/documentation/foundationmodels/managing-the-context-window
- **Rate limits and cost.** Apple engineers in the WWDC25 lab: "In the foreground, there is no rate limit unless the device is under heavy load"; background use has a budget. No per-call charge is documented for the on-device model. Private Cloud Compute is free for App Store Small Business Program members with fewer than 2 million first-time downloads. Confidence: medium-high. Sources: https://developer.apple.com/forums/thread/791086 ; https://developer.apple.com/wwdc26/guides/ios/
- **Guided generation and tools.** `@Generable`, `@Guide`, `Tool`, `GenerationSchema`, and `DynamicGenerationSchema` exist. A "pick N swappable words with glosses" schema fits guided generation. Confidence: high. Source: https://developer.apple.com/documentation/foundationmodels
- **Translation framework.** Framework availability iOS 17.4 / macOS 14.4 for `translationPresentation`. `TranslationSession` requires iOS 18 / macOS 15. "All translations using the `TranslationSession` class are processed on the user's device." Batch APIs: `translate(batch:)` and `translations(from:)`. `LanguageAvailability` checks pairs; the language list is not on the pages read. Confidence: high for availability and batch; low for the pair list. Sources: https://developer.apple.com/documentation/translation ; https://developer.apple.com/documentation/translation/translationsession
- **NaturalLanguage.** `NLTagger` (iOS 12 / macOS 10.14) tags "part of speech, lexical class, lemma, script, and language." Per-language support is discovered at runtime with `availableTagSchemes(for:language:)`; Apple publishes no per-scheme language list. Confidence: high for API; medium for coverage. Source: https://developer.apple.com/documentation/naturallanguage/nltagger
- **AVSpeechSynthesizer.** iOS 7+ / macOS 10.14+, free system TTS with per-language voices via `AVSpeechSynthesisVoice`. Confidence: high. Source: https://developer.apple.com/documentation/avfaudio/avspeechsynthesizer

### D8. Android on-device intelligence

- **ML Kit GenAI APIs.** Status on the live overview page: Summarization, Proofreading, Rewriting, Image Description are Beta; Prompt API is Beta (structured output Alpha, prefix caching Experimental). The Prompt API "allows you to send natural language and multimodal requests to Gemini Nano." It was announced as Alpha on October 30, 2025. Confidence: high. Sources: https://developers.google.com/ml-kit/genai ; https://developer.android.com/blog/posts/ml-kit-s-prompt-api-unlock-custom-on-device-gemini-nano-experiences
- **Devices.** Prompt API runs on nano-v2 devices (OnePlus 13, Xiaomi 15 series, Galaxy Z Fold7, others), nano-v3 (Pixel 9 and 10 series, Galaxy S26 series, OnePlus 15, others), and nano-v4 (Pixel 11 series, Galaxy Z Fold8 and Flip8). Galaxy S25 appears only for the task APIs. Confidence: high. Source: https://developers.google.com/ml-kit/genai
- **Constraints.** "GenAI API inference is permitted only when the app is the top foreground application." Too many requests return `ErrorCode.BUSY`. "No additional server cost incurred for each API call." Languages are not listed per API: "Availability of specific language support may vary depending on the particular device's configuration." Confidence: high.
- **ML Kit Translation.** "Translate between more than 50 different languages," on device, "English is used as an intermediate translation" for non-English pairs, attribution required. Model size per language is not stated on the current page. Confidence: high. Source: https://developers.google.com/ml-kit/language/translation
- **Android TTS.** `android.speech.tts.TextToSpeech` is the built-in engine API. Confidence: high. Source: https://developer.android.com/reference/android/speech/tts/TextToSpeech

### D9. Chrome built-in AI for extensions (brief)

The Prompt API is listed for Web Extensions from Chrome 138, with no origin trial needed; the page tells extension developers to remove the expired `aiLanguageModelOriginTrial` permission. Hardware: Windows 10/11, macOS 13+, Linux, or Chromebook Plus; "At least 22 GB of free space"; a GPU with "Strictly more than 4 GB of VRAM" or a CPU path with 16 GB RAM and 4 cores. Prompt languages: en, ja, es, de, fr. Model size is not published; check `chrome://on-device-internals`. Translator API and Language Detector API are listed at Chrome 138 and "work in Chrome on desktop. These APIs don't work on mobile devices." Confidence: high. Sources: https://developer.chrome.com/docs/extensions/ai/prompt-api ; https://developer.chrome.com/docs/ai/translator-api ; https://developer.chrome.com/docs/ai/language-detection

---

## 3. Existing apps that prove each approach

| Approach | App | Platform | Mechanism | Link |
|---|---|---|---|---|
| Safari web extension (macOS + iOS) | Immersive Translate | macOS 12+, iOS 15.5+, visionOS | Packaged web extension in an App Store app; bilingual page rendering | https://apps.apple.com/app/immersive-translate/id6447957425 |
| Firefox for Android extension | 450+ AMO Android extensions (e.g., Dark Reader, uBlock Origin) | Android | Open AMO ecosystem since Dec 2023 | https://blog.mozilla.org/addons/2023/12/14/a-new-world-of-open-extensions-on-firefox-for-android-has-arrived/ |
| macOS accessibility overlay | Grammarly for Mac | macOS | Accessibility permission; underlines inside other apps' text fields; floating widget | https://support.grammarly.com/hc/en-us/articles/360059770451-Why-does-Grammarly-need-access-to-accessibility-features |
| macOS AX selection + OCR | Easydict | macOS | Accessibility for selected text; Screen Recording for OCR; popup window | https://github.com/tisfeng/Easydict |
| macOS OCR popup | Bob | macOS | Screenshot OCR, popup translation | https://bobtranslate.com |
| Android accessibility overlay | ScreenTranslate (lomoware) | Android | AccessibilityService reads on-screen text and scroll events; overlay draws translations | https://play.google.com/store/apps/details?id=com.lomoware.screen_translate |
| Android accessibility overlay | Screen Translate AI OCR | Android | Accessibility + overlay permissions; reads on-screen text for translation | https://play.google.com/store/apps/details?id=com.screen.translate.google |
| Android copy-triggered overlay | Google Translate Tap to Translate | Android | Clipboard trigger; "Display over other apps"; no screen reading | https://support.google.com/translate/answer/6350658 |
| Reader app with in-line glosses | Kindle Word Wise | Kindle, Fire, Kindle for Android | Publisher-side gloss data rendered above words; English books only | https://www.amazon.com/gp/help/customer/display.html?nodeId=201645250 |
| Reader app with import | LingQ | Web, iOS, Android | Lesson import via app and API; per-word status cards | https://www.lingq.com/apidocs/api-2.0.html |
| Reader app with import | Readlang | Web + extension | Readability import; click-to-translate | https://blog.readlang.com/2015/12/10/import-clean-readable-versions-of-webpages-to-practice-language-learning.html |
| Reader with HTML export API | Readwise Reader | iOS, Android, web | v3 API returns document HTML | https://readwise.io/reader_api |

---

## 4. Ranked recommendation

1. **Safari web extension for macOS and iOS first.** It reuses almost all of the Chrome code, the App Store Connect packager removes the Mac/Xcode requirement, and it is the only route onto iPhone. Budget for: tap instead of hover, `registerContentScripts` needing Safari 16.4+, native-messaging rewrite into the containing app, and Guideline 4.4.2 site-access justification.
2. **Firefox for Android second.** Same codebase with an MV3 event page instead of a service worker. Free distribution, no review gate like Apple's. It is the only open extension ecosystem on Android phones.
3. **Native reader app third (iOS, then Android), rendering fetched content in a web view.** This is the path to Apple Books-style reading without Apple Books. Pair it with Foundation Models (free, on-device, 4096-token sessions, guided generation) and the Translation framework to remove the API-key barrier on supported hardware.
4. **Android accessibility overlay fourth.** Technically the strongest system-wide option (text nodes, character bounds, overlays). Play policy allows it with prominent disclosure, but every update is a policy exposure. Keep it read-only and never automate actions.
5. **macOS accessibility overlay only as a later experiment.** Grammarly proves the mechanism, but it is Developer ID only, fragile across apps, and Electron requires enabling AX per app.
6. **Do not pursue the macOS OCR overlay or any iOS system-wide approach.** iOS has no API for it. OCR on macOS loses text semantics, needs re-capture on every scroll, and faces monthly Screen Recording re-approval on current macOS.

---

## 5. Items that could not be verified

- Safari background service worker lifetime on current iOS (only 2024 forum reports).
- Whether a Safari web extension's native handler may call Foundation Models (no Apple statement either way).
- Word-level `BoundsForRange` accuracy in Chromium/Electron on macOS; AX text support in Preview and Chrome PDF viewer.
- Mac App Store eligibility of a ScreenCaptureKit-only overlay app.
- Per-character accessibility bounds in Android WebView, Compose, and Flutter.
- Translation framework language pairs (use `LanguageAvailability` at runtime).
- ML Kit translation model size per language (current page omits it).
- Kindle Word Wise on the Kindle iOS app (Amazon help page returned 403).
- Instapaper and Matter API details (pages JS-rendered or secondary only).
- Apple Books and Kindle content access from third-party apps (absence finding, no primary source).
- Microsoft Edge for Android extension catalog status in 2026.
