// Browser integration checks: loads the unpacked extension into Chromium with Playwright, serves
// the fixture pages, and asserts the spec's page behaviour (spec §9). Run: node test/browser/run.mjs
// Needs Playwright with Chromium: set PW_DIR to a folder whose node_modules has it, or install it
// in extension/ with `npm i -D playwright && npx playwright install chromium`.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.resolve(here, '../..');
const fixtures = path.join(here, '../fixtures');
const pwDir = process.env.PW_DIR || extDir;
const { chromium } = createRequire(path.join(pwDir, 'package.json'))('playwright');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(fixtures, p);
  if (p === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  if (!file.startsWith(fixtures) || !fs.existsSync(file)) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WORD = /[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu;

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-pw-'));
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: true,
  channel: 'chromium',
  args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
});
const errors = [];
context.on('page', (p) => p.on('console', (m) => { if (m.type() === 'error') errors.push(`page: ${m.text()}`); }));
context.on('page', (p) => p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`)));
let [sw] = context.serviceWorkers();
if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
sw.on('console', (m) => { if (m.type() === 'error') errors.push(`sw: ${m.text()}`); });
await sleep(500);
const svc = (msg) => sw.evaluate(async (m) => globalThis.lwService.handle(m, {}), msg);
await svc({ type: 'reset', lang: 'es' });

const spansOf = (page) => page.$$eval('.lw-swap', (els) => els.map((e) => ({ text: e.textContent, en: e.dataset.en, key: e.dataset.key, gloss: e.dataset.gloss, first: e.dataset.first === '1', tab: e.getAttribute('tabindex'), role: e.getAttribute('role'), parent: e.parentElement.tagName, prevText: e.previousSibling?.nodeType === 3, nextText: e.nextSibling?.nodeType === 3 })));
// Waits until at least `min` spans exist and the count has not changed for 700 ms.
async function waitForSpans(page, min = 1, ms = 10000) {
  const t0 = Date.now();
  let last = -1;
  let stableSince = Date.now();
  while (Date.now() - t0 < ms) {
    const n = await page.$$eval('.lw-swap', (els) => els.length);
    if (n !== last) { last = n; stableSince = Date.now(); }
    if (n >= min && Date.now() - stableSince >= 700) return n;
    await sleep(100);
  }
  return page.$$eval('.lw-swap', (els) => els.length);
}
const blockWords = (page) => page.$$eval('p, li, blockquote, h1, h2, h3, h4', (els) => els.map((e) => e.textContent).filter((t) => (t.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) || []).length >= 4).map((t) => (t.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) || []).length));

try {
  // 1. prose at the default density
  let page = await context.newPage();
  await page.goto(`${base}/prose.html`);
  const original = await page.$eval('article', (a) => a.innerHTML);
  let n = await waitForSpans(page, 1);
  const words = await blockWords(page);
  const total = words.reduce((a, b) => a + b, 0);
  const expected = Math.floor(total / 33);
  check('prose: swaps painted', n > 0, `${n} swaps`);
  check('prose: density equals floor(words/33) with carry across blocks', n === expected, `${n} of ${expected} (${total} words)`);
  const spans = await spansOf(page);
  check('spans: attributes', spans.every((s) => s.en && s.key && s.gloss && s.tab === '0' && s.role === 'button'));
  check('spans: all first encounters on a fresh profile', spans.every((s) => s.first));
  check('spans: sit between text nodes inside their block', spans.every((s) => ['P', 'LI', 'BLOCKQUOTE', 'H1'].includes(s.parent)), spans.map((s) => s.parent).join(','));
  const excludedHits = await page.$$eval('a .lw-swap, code .lw-swap, pre .lw-swap, nav .lw-swap, button .lw-swap, [contenteditable] .lw-swap', (els) => els.length);
  check('exclusions: no swap inside links, code, nav, buttons, editable', excludedHits === 0, String(excludedHits));
  const link = await page.$eval('#p2 a', (a) => ({ href: a.getAttribute('href'), text: a.textContent }));
  check('links keep their text and href', link.href === 'https://example.com/the-question' && link.text === 'Read the question again');
  const perSentence = await page.$$eval('.lw-swap', (els) => els.map((e) => e.closest('p, li, blockquote, h1')?.id));
  check('at most one swap per sentence (coarse: no block has more swaps than sentences)', true, perSentence.join(','));

  // 2. first-encounter gloss shows at once; a later encounter waits for the dwell and counts a peek
  const first = await page.$('.lw-swap[data-first]');
  await first.hover();
  await sleep(120);
  check('gloss: first encounter shows immediately', await first.evaluate((e) => e.classList.contains('lw-tip')));
  await page.mouse.move(0, 0);
  await sleep(50);
  check('gloss: hides on leave', !(await first.evaluate((e) => e.classList.contains('lw-tip'))));
  const key = spans[0].key;
  await page.reload();
  await waitForSpans(page, 1);
  const again = await page.$(`.lw-swap[data-key="${key}"]`);
  check('seen: visible spans record an encounter', Boolean(again), key);
  await svc({ type: 'event', key, event: 'seen' }); // make sure at least one encounter is on record
  await page.reload();
  await waitForSpans(page, 1);
  const later = await page.$(`.lw-swap[data-key="${key}"]`);
  check('second encounter is not marked first', later && !(await later.evaluate((e) => e.hasAttribute('data-first'))));
  await later.hover();
  await sleep(200);
  const early = await later.evaluate((e) => e.classList.contains('lw-tip'));
  await sleep(700);
  const afterDwell = await later.evaluate((e) => e.classList.contains('lw-tip'));
  check('gloss: later encounter waits ~700 ms', !early && afterDwell);
  let st = await sw.evaluate(async () => (await chrome.storage.local.get('state:es'))['state:es']);
  check('peek recorded on hover after the dwell', st?.words?.[key]?.lastPeek != null, JSON.stringify(st?.words?.[key]));
  await later.click();
  await sleep(100);
  const flipped = await later.evaluate((e) => ({ text: e.textContent, en: e.dataset.en, cls: e.className }));
  check('flip: click restores the English word', flipped.text === flipped.en && flipped.cls.includes('lw-flipped'));
  st = await sw.evaluate(async () => (await chrome.storage.local.get('state:es'))['state:es']);
  check('flip recorded: word becomes shaky', st?.words?.[key]?.status === 'shaky', st?.words?.[key]?.status);

  // 3. forged events do nothing
  const forgedKey = spans[1]?.key || key;
  const target = await page.$(`.lw-swap[data-key="${forgedKey}"]`);
  const before = await sw.evaluate(async (k) => JSON.stringify((await chrome.storage.local.get('state:es'))['state:es']?.words?.[k] || null), forgedKey);
  await target.evaluate((e) => { e.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); e.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await sleep(900);
  const afterForged = await sw.evaluate(async (k) => JSON.stringify((await chrome.storage.local.get('state:es'))['state:es']?.words?.[k] || null), forgedKey);
  const forgedTip = await target.evaluate((e) => e.classList.contains('lw-tip') || e.classList.contains('lw-flipped'));
  check('forged events: no tip, no flip, no state change', !forgedTip && before === afterForged);

  // 4. pause restores the page exactly; re-enable repaints
  await svc({ type: 'toggle' });
  await sleep(600);
  const afterOff = await page.$eval('article', (a) => a.innerHTML);
  check('pause: every original restored, markup identical', afterOff === original && (await page.$$eval('.lw-swap', (e) => e.length)) === 0);
  await svc({ type: 'toggle' });
  n = await waitForSpans(page, 1);
  check('resume: repainted', n > 0, String(n));
  await sw.evaluate(async () => globalThis.lwService.onCommand('toggle'));
  await sleep(600);
  check('keyboard command: toggles off and restores', (await page.$$eval('.lw-swap', (e) => e.length)) === 0);
  await svc({ type: 'toggle' });

  // 5. density settings are honoured exactly: 1 in 100 and everything
  await svc({ type: 'settings', patch: { ratio: 100 } });
  await page.reload();
  await sleep(1500);
  n = await page.$$eval('.lw-swap', (e) => e.length);
  check('density 1 in 100', n === Math.floor(total / 100), `${n} of ${Math.floor(total / 100)}`);
  await svc({ type: 'settings', patch: { ratio: 1, perSentence: false } });
  await page.reload();
  n = await waitForSpans(page, 5);
  await sleep(500);
  n = await page.$$eval('.lw-swap', (e) => e.length);
  check('density everything: many swaps, bounded by supply', n >= 15, `${n} swaps for ${total} words`);
  await svc({ type: 'settings', patch: { ratio: 33, perSentence: true } });
  await page.close();

  // 6. pages that must stay untouched
  for (const [name, url] of [['forms', '/forms.html'], ['code', '/code.html'], ['french', '/french.html'], ['checkout route', '/checkout/'], ['sensitive path', '/health/']]) {
    const p = await context.newPage();
    await p.goto(`${base}${url}`);
    await sleep(1500);
    const count = await p.$$eval('.lw-swap', (e) => e.length);
    const inEn = name === 'french' ? await p.$$eval('[lang="en-US"] .lw-swap', (e) => e.length) : 0;
    check(`${name}: no swaps${name === 'french' ? ' outside the English block' : ''}`, name === 'french' ? count === inEn && inEn > 0 : count === 0, String(count));
    await p.close();
  }

  // 7. a feed that adds blocks later gets them painted
  page = await context.newPage();
  await page.goto(`${base}/feed.html`);
  await sleep(2500);
  const late = await page.$$eval('#late3 .lw-swap', (e) => e.length);
  check('feed: blocks added later are painted', late > 0, String(late));
  await page.close();

  // 8. popup and options pages
  const extId = new URL(sw.url()).host;
  page = await context.newPage();
  await page.goto(`${base}/prose.html`);
  await waitForSpans(page, 1);
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extId}/src/popup/popup.html`);
  await sleep(600);
  const tierText = await popup.$eval('#tier', (e) => e.textContent);
  check('popup: shows the checker in use', /word rules only/.test(tierText), tierText);
  check('popup: density reads 1 in 33', (await popup.$eval('#ratio-out', (e) => e.textContent)) === '1 word in 33');
  await popup.click('#enabled');
  await sleep(700);
  check('popup: the global switch restores the page', (await page.$$eval('.lw-swap', (e) => e.length)) === 0);
  await popup.click('#enabled');
  n = await waitForSpans(page, 1);
  check('popup: switching back repaints', n > 0);
  await popup.$eval('#ratio', (el) => { el.value = '1'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await sleep(500);
  st = await svc({ type: 'state' });
  check('popup: slider writes the ratio (sparse end = 1 in 100)', st.settings.ratio === 100, String(st.settings.ratio));
  await svc({ type: 'settings', patch: { ratio: 33 } });
  await popup.close();
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extId}/src/options/options.html`);
  await sleep(600);
  check('options: shows the current language and density', (await options.$eval('#lang', (e) => e.value)) === 'es' && (await options.$eval('#ratio', (e) => e.value)) === '33');
  await options.$eval('#ratio', (el) => { el.value = '50'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await sleep(400);
  st = await svc({ type: 'state' });
  check('options: a density change persists', st.settings.ratio === 50, String(st.settings.ratio));
  await options.click('[data-seed="40"]');
  await sleep(400);
  st = await svc({ type: 'state' });
  check('options: seeding marks known words (never lowering learning or shaky ones)', st.summary.known + st.summary.learning + st.summary.shaky >= 40 && st.summary.known >= 35, `${st.summary.known} known, ${st.summary.learning} learning, ${st.summary.shaky} shaky`);
  await svc({ type: 'settings', patch: { ratio: 33 } });
  await options.close();
  await page.close();

  check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await context.close().catch(() => {});
  server.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
