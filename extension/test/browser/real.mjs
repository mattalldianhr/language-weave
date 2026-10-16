// Loads the extension into Chromium and opens real pages: counts swaps, words, console errors, and
// prints every swap so a human can read them for sense. Writes screenshots to --shots <dir>.
// Usage: node test/browser/real.mjs [--lang es] [--ratio 33] [--shots dir] URL [URL...]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.resolve(here, '../..');
const pwDir = process.env.PW_DIR || extDir;
const { chromium } = createRequire(path.join(pwDir, 'package.json'))('playwright');

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : def; };
const urls = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
const lang = opt('lang', 'es');
const ratio = Number(opt('ratio', '33'));
const shots = opt('shots', '');
if (!urls.length) { console.error('give at least one URL'); process.exit(2); }
if (shots) fs.mkdirSync(shots, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-real-'));
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: true, channel: 'chromium', viewport: { width: 1280, height: 900 },
  args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
});
let [sw] = context.serviceWorkers();
if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
const errors = [];
sw.on('console', (m) => { if (m.type() === 'error') errors.push(`sw: ${m.text()}`); });
await sleep(400);
const svc = (msg) => sw.evaluate(async (m) => globalThis.lwService.handle(m, {}), msg);
await svc({ type: 'reset', lang });
await svc({ type: 'settings', patch: { lang, ratio } });

try {
  for (const url of urls) {
    const page = await context.newPage();
    const pageErrors = [];
    page.on('console', (m) => { if (m.type() === 'error' && /language-weave|lw-/.test(m.text())) pageErrors.push(m.text()); });
    page.on('pageerror', (e) => pageErrors.push(e.message));
    const t0 = Date.now();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (e) {
      console.log(`\n# ${url}\n  could not load: ${e.message}`);
      await page.close();
      continue;
    }
    // scroll through the page so lazy blocks are considered
    for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 1200); await sleep(250); }
    await sleep(2500);
    const swaps = await page.$$eval('.lw-swap', (els) => els.map((e) => {
      const block = e.closest('p, li, blockquote, h1, h2, h3, h4, dd, dt, figcaption, td, th');
      const t = block?.textContent || '';
      const i = t.indexOf(e.textContent);
      return { en: e.dataset.en, form: e.textContent, ctx: t.slice(Math.max(0, i - 40), i + e.textContent.length + 40).replace(/\s+/g, ' ') };
    }));
    const words = await page.$$eval('p, li, blockquote, h1, h2, h3, h4, dd, dt, figcaption, td, th', (els) => {
      const W = /[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu;
      let n = 0;
      for (const el of els) { if (el.querySelector('p, li, blockquote, h1, h2, h3, h4')) continue; const c = (el.textContent.match(W) || []).length; if (c >= 4) n += c; }
      return n;
    });
    const title = await page.title();
    console.log(`\n# ${title}\n  ${url}\n  ${words} words in blocks, ${swaps.length} swaps (1 in ${swaps.length ? Math.round(words / swaps.length) : '∞'}), ${(Date.now() - t0) / 1000}s, errors: ${pageErrors.length}`);
    for (const s of swaps) console.log(`  - ${s.en} → ${s.form}    …${s.ctx}…`);
    for (const e of pageErrors.slice(0, 3)) console.log(`  ! ${e}`);
    if (shots) {
      await page.screenshot({ path: path.join(shots, `${title.replace(/[^\w]+/g, '-').slice(0, 40) || 'page'}.png`), fullPage: false });
    }
    await page.close();
  }
} finally {
  await context.close().catch(() => {});
  fs.rmSync(userDataDir, { recursive: true, force: true });
}
if (errors.length) console.log(`\nbackground errors: ${errors.join(' | ')}`);
