// Firefox smoke test: web-ext installs the extension as a temporary add-on in a headless Firefox,
// opens the report fixture, and the page prints LW_SWAPS=<n> to stdout (Firefox echoes page console
// output when devtools.console.stdout.content is set). Pass = the add-on loads and paints.
// Usage: node test/browser/firefox-smoke.mjs   (FIREFOX_BIN and WEB_EXT override the binaries)
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.resolve(here, '../..');
const fixtures = path.join(here, '../fixtures');

function findFirefox() {
  if (process.env.FIREFOX_BIN) return process.env.FIREFOX_BIN;
  const cache = path.join(os.homedir(), '.cache', 'ms-playwright');
  if (fs.existsSync(cache)) {
    const dirs = fs.readdirSync(cache).filter((d) => d.startsWith('firefox-')).sort().reverse();
    for (const d of dirs) {
      const bin = path.join(cache, d, 'firefox', 'firefox');
      if (fs.existsSync(bin)) return bin;
    }
  }
  return 'firefox';
}
const firefox = findFirefox();
const webExt = process.env.WEB_EXT || 'web-ext';

let reported = null; // the page beacons its swap count here; stdout is not relayed reliably
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/lw-report') {
    reported = Number(u.searchParams.get('n'));
    res.writeHead(204);
    res.end();
    finish(reported > 0, `page reported ${reported} swaps`);
    return;
  }
  const p = u.pathname;
  const file = path.join(fixtures, p === '/' ? 'report.html' : p);
  if (!file.startsWith(fixtures) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/report.html`;

const args = ['run', '--source-dir', extDir, '--firefox', firefox, '--start-url', url, '--no-input', '--no-reload',
  '--args=-headless', '--pref', 'devtools.console.stdout.content=true', '--ignore-files', 'test/**', 'dist/**'];
console.log(`firefox: ${firefox}`);
let out = '';
let result = null;
let child = null;
function finish(ok, why) {
  if (result) return;
  result = { ok, why };
  if (child) {
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 3000).unref();
  }
}
child = spawn(webExt, args, { stdio: ['ignore', 'pipe', 'pipe'] });
const onData = (buf) => {
  const s = buf.toString();
  out += s;
  const m = /LW_SWAPS=(\d+)/.exec(s);
  if (m) finish(Number(m[1]) > 0, `page reported ${m[1]} swaps`);
  if (/failed to load|Error: .*manifest|is not a valid extension|Install failed/i.test(s)) finish(false, s.trim().slice(0, 200));
};
child.stdout.on('data', onData);
child.stderr.on('data', onData);
const timer = setTimeout(() => finish(false, 'timed out after 60 s without a swap count'), 60000);
await new Promise((r) => child.on('exit', r));
clearTimeout(timer);
server.close();
if (!result) result = { ok: false, why: `web-ext exited early: ${out.slice(-400)}` };
console.log(`${result.ok ? 'PASS' : 'FAIL'} firefox: ${result.why}`);
if (!result.ok) console.log(out.split('\n').filter((l) => /extension|Firefox|error|LW_/i.test(l)).slice(-15).join('\n'));
process.exit(result.ok ? 0 : 1);
