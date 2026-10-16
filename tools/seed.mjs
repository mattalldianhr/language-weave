#!/usr/bin/env node
// Writes extension/seed.json, which the extension applies once on its first run.
// Usage: node tools/seed.mjs --lang fr [--known 0|40|150] [--ratio 33] [--sites all|ask] [--out extension/seed.json]
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true'] : null)).filter(Boolean));
const LANGS = ['es', 'fr', 'de', 'it', 'pt'];
if (!LANGS.includes(args.lang)) {
  console.error(`--lang must be one of ${LANGS.join(', ')}`);
  process.exit(2);
}
const seed = { lang: args.lang };
if (args.known != null) seed.known = Math.max(0, Number(args.known) || 0);
if (args.ratio != null) seed.ratio = Math.max(1, Number(args.ratio) || 33);
if (args.sites === 'ask' || args.sites === 'all') seed.sites = { mode: args.sites, allow: [], deny: [] };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(args.out || path.join(root, 'extension', 'seed.json'));
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(seed, null, 2) + '\n');
console.log(`wrote ${out}: ${JSON.stringify(seed)}`);
