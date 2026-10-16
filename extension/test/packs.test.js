import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { validatePack, lookup, nounPhrase } from '../src/shared/pack.js';

const dir = new URL('../packs/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

test('ships at least the five launch packs', () => {
  for (const lang of ['es', 'fr', 'de', 'it', 'pt']) assert.ok(files.includes(`${lang}.json`), `${lang}.json`);
});

for (const f of files) {
  const pack = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
  test(`${f} validates and has enough entries`, () => {
    const r = validatePack(pack);
    assert.deepEqual(r.errors.slice(0, 5), []);
    assert.ok(r.ok);
    assert.equal(pack.lang, f.replace('.json', ''));
    const n = Object.keys(pack.entries).length;
    assert.ok(n >= 300, `${f}: ${n} entries`);
    assert.ok(pack.blocklist.length >= 50, 'blocklist');
    const classes = new Set(Object.values(pack.entries).map((e) => e.class));
    for (const c of ['conn', 'adv', 'noun', 'adj']) assert.ok(classes.has(c), c);
    assert.ok(!classes.has('phrase'));
  });

  test(`${f} builds article-bearing noun phrases for every noun`, () => {
    for (const [key, e] of Object.entries(pack.entries)) {
      if (e.class !== 'noun') continue;
      const entry = lookup(pack, ...key.split('|'));
      if (!entry) continue; // dropped
      const np = nounPhrase(pack, entry, { number: 'sg', definite: 'def', case: 'nom' });
      assert.ok(np && np.includes(' ') || (np && np.includes("'")), `${f} ${key}: ${np}`);
    }
  });
}
