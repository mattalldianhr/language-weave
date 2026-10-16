import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteEnabled, routeBlocked, sensitiveUrl, hostOf, setSite } from '../src/shared/sites.js';

const all = { mode: 'all', allow: [], deny: ['bank.example'] };
const ask = { mode: 'ask', allow: ['news.example'], deny: [] };

test('siteEnabled follows the mode and the lists, matching subdomains', () => {
  assert.equal(siteEnabled(all, 'https://news.example/a'), true);
  assert.equal(siteEnabled(all, 'https://bank.example/a'), false);
  assert.equal(siteEnabled(all, 'https://www.bank.example/a'), false);
  assert.equal(siteEnabled(ask, 'https://news.example/a'), true);
  assert.equal(siteEnabled(ask, 'https://other.example/a'), false);
  assert.equal(siteEnabled(all, 'chrome://extensions'), false);
});

test('routeBlocked skips login, checkout, billing, account, and banking paths', () => {
  assert.equal(routeBlocked('https://shop.example/checkout/step-2'), true);
  assert.equal(routeBlocked('https://x.example/login'), true);
  assert.equal(routeBlocked('https://x.example/settings/billing'), true);
  assert.equal(routeBlocked('https://x.example/articles/accounting-history'), false);
  assert.equal(routeBlocked('https://x.example/blog/my-account-of-the-war'), false);
});

test('sensitiveUrl flags health and finance hosts and paths', () => {
  assert.equal(sensitiveUrl('https://www.webmd.com/cancer'), true);
  assert.equal(sensitiveUrl('https://example.com/health/symptoms'), true);
  assert.equal(sensitiveUrl('https://mail.google.com/'), true);
  assert.equal(sensitiveUrl('https://en.wikipedia.org/wiki/Volcano'), false);
});

test('setSite toggles a host in the right list for the mode', () => {
  let s = setSite(all, 'https://news.example/x', false);
  assert.deepEqual(s.deny, ['bank.example', 'news.example']);
  s = setSite(s, 'https://news.example/x', true);
  assert.deepEqual(s.deny, ['bank.example']);
  let a = setSite(ask, 'https://other.example/', true);
  assert.deepEqual(a.allow, ['news.example', 'other.example']);
  a = setSite(a, 'https://other.example/', false);
  assert.deepEqual(a.allow, ['news.example']);
  assert.equal(hostOf('https://WWW.Example.com/x'), 'example.com');
});
