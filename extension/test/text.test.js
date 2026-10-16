import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitSentences, hashText, countWords, overlapsBlocklist } from '../src/shared/text.js';

test('splitSentences returns spans with exact offsets', () => {
  const text = 'It rained. We stayed in!  Then what?';
  const s = splitSentences(text);
  assert.deepEqual(s.map((x) => text.slice(x.start, x.end)), ['It rained.', 'We stayed in!', 'Then what?']);
  assert.equal(s[0].start, 0);
  assert.equal(s[1].start, 11);
});

test('splitSentences does not split on common abbreviations or initials', () => {
  const text = 'Dr. Smith met J. K. Rowling, e.g. at noon. They left.';
  const s = splitSentences(text);
  assert.equal(s.length, 2);
  assert.equal(text.slice(s[1].start, s[1].end), 'They left.');
});

test('splitSentences keeps a sentence without terminal punctuation', () => {
  const s = splitSentences('No full stop here');
  assert.equal(s.length, 1);
  assert.equal(s[0].end, 17);
});

test('hashText is stable and sensitive', () => {
  assert.equal(hashText('hello world'), hashText('hello world'));
  assert.notEqual(hashText('hello world'), hashText('hello worlds'));
  assert.match(hashText('x'), /^[0-9a-f]{8}$/);
});

test('countWords counts running words, apostrophes inside a word, digits', () => {
  assert.equal(countWords("It's 1992, and we're twenty-two."), 6);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('café naïve'), 2);
});

test('overlapsBlocklist finds a whole-expression overlap, case-insensitive', () => {
  const text = 'We saw a lot of birds, as well as cats.';
  const bl = ['a lot of', 'as well as'];
  const lot = text.indexOf('lot');
  assert.equal(overlapsBlocklist(text, lot, lot + 3, bl), true);
  const birds = text.indexOf('birds');
  assert.equal(overlapsBlocklist(text, birds, birds + 5, bl), false);
  const well = text.indexOf('well');
  assert.equal(overlapsBlocklist(text, well, well + 4, bl), true);
  assert.equal(overlapsBlocklist('Alot of', 0, 4, bl), false);
});
