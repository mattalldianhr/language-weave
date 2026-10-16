import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tagBlock } from '../src/weave/tag.js';

const text = 'The “old” cats weren\'t sleeping, but Dr. Smith thought the big question was hard. We also think so—really.';

test('tokens carry exact offsets into the original string', () => {
  const { tokens } = tagBlock(text);
  for (const t of tokens) {
    assert.equal(text.slice(t.start, t.end), t.text, `offset of ${t.text}`);
    assert.ok(t.end > t.start, 'no zero-length tokens');
  }
  assert.ok(tokens.some((t) => t.text === 'old'));
  assert.ok(tokens.some((t) => t.text === "weren't"));
});

test('tokens map POS, lemma, and number', () => {
  const { tokens } = tagBlock(text);
  const by = (s) => tokens.find((t) => t.text === s);
  assert.equal(by('cats').pos, 'NOUN');
  assert.equal(by('cats').lemma, 'cat');
  assert.equal(by('cats').number, 'pl');
  assert.equal(by('question').number, 'sg');
  assert.equal(by('thought').pos, 'VERB');
  assert.equal(by('thought').lemma, 'think');
  assert.equal(by('but').pos, 'CONJ');
  assert.equal(by('also').pos, 'ADV');
  assert.equal(by('also').lemma, 'also');
  assert.equal(by('really').lemma, 'really');
  assert.equal(by('Smith').pos, 'PROPN');
  assert.equal(by('big').pos, 'ADJ');
  assert.equal(by('The').pos, 'DET');
  assert.equal(by('We').pos, 'PRON');
  assert.equal(by('was').pos, 'AUX');
});

test('comparative and superlative forms are flagged', () => {
  const { tokens } = tagBlock('A bigger house is the best house, and it sells faster.');
  const by = (s) => tokens.find((t) => t.text === s);
  assert.equal(by('bigger').degree, 'comparative');
  assert.equal(by('best').degree, 'superlative');
  assert.equal(by('faster').degree, 'comparative');
  assert.equal(by('house').degree, null);
});

test('sentences have offsets and tokens know their sentence', () => {
  const { sentences, tokens } = tagBlock(text);
  assert.equal(sentences.length, 2);
  assert.equal(text.slice(sentences[1].start, sentences[1].end), 'We also think so—really.');
  assert.equal(tokens.find((t) => t.text === 'really').sentence, 1);
  assert.equal(tokens.find((t) => t.text === 'cats').sentence, 0);
});

test('noun phrases expose determiner, adjectives, and head noun', () => {
  const { tokens, phrases } = tagBlock(text);
  const q = phrases.find((p) => tokens[p.noun].text === 'question');
  assert.equal(tokens[q.det].text, 'the');
  assert.deepEqual(q.adjs.map((i) => tokens[i].text), ['big']);
  assert.equal(text.slice(q.start, q.end), 'the big question');
  const c = phrases.find((p) => tokens[p.noun].text === 'cats');
  assert.equal(tokens[c.det].text, 'The');
  assert.deepEqual(c.adjs.map((i) => tokens[i].text), ['old']);
  const bare = tagBlock('Cats sleep a lot.').phrases.find((p) => true);
  assert.equal(bare.det, null);
});

test('hyphenated and apostrophe tokens keep their text', () => {
  const t = 'A well-known twenty-two-year-old can\'t.';
  const { tokens } = tagBlock(t);
  for (const tok of tokens) assert.equal(t.slice(tok.start, tok.end), tok.text);
  assert.ok(tokens.some((x) => x.hyphenated));
});

test('throughput on 10 KB of prose (reported, not gated)', () => {
  const para = 'The committee published its findings on Tuesday, but the mayor said the question of funding was still open. ';
  const big = para.repeat(Math.ceil(10240 / para.length));
  const t0 = performance.now();
  const { tokens } = tagBlock(big);
  const ms = performance.now() - t0;
  console.log(`tagBlock: ${big.length} chars, ${tokens.length} tokens, ${ms.toFixed(0)} ms`);
  assert.ok(tokens.length > 1000);
});
