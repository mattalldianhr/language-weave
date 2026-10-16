import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));

// Keys and permissions outside the WebExtensions common subset (research/platforms.md §1): Safari
// has no webRequestBlocking, identity, or update_url; iOS has no contextMenus or windows.create;
// Firefox for Android has no background service worker without scripts, no menus, no native messaging.
test('manifest stays inside the Safari and Firefox common subset', () => {
  const perms = new Set([...(manifest.permissions || []), ...(manifest.optional_permissions || [])]);
  for (const p of ['webRequestBlocking', 'identity', 'nativeMessaging', 'contextMenus', 'menus', 'sidePanel', 'tts', 'debugger']) {
    assert.ok(!perms.has(p), `permission ${p}`);
  }
  assert.equal(manifest.update_url, undefined);
  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.background.service_worker, 'Chrome service worker');
  assert.ok(Array.isArray(manifest.background.scripts), 'Firefox event page scripts');
  assert.equal(manifest.background.type, 'module');
});

test('every file the manifest references exists', () => {
  const root = new URL('../', import.meta.url);
  const files = [
    manifest.background.service_worker,
    ...manifest.content_scripts.flatMap((c) => [...c.js, ...(c.css || [])]),
    manifest.action.default_popup,
    manifest.options_ui.page,
  ];
  for (const f of files) assert.ok(existsSync(new URL(f, root)), f);
});

test('no host is granted by default; cloud endpoints are optional', () => {
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.optional_host_permissions, ['https://*/*']);
});
