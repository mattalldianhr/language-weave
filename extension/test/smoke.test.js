import { test } from 'node:test';
import assert from 'node:assert/strict';
import nlp from '../vendor/compromise.mjs';

test('vendored compromise loads and tags a noun', () => {
  const doc = nlp('The cat sat.');
  assert.equal(doc.nouns().length, 1);
  assert.equal(doc.nouns().text(), 'The cat');
});
