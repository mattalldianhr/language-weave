// Options page: everything the popup does not need every day.
const api = globalThis.chrome || globalThis.browser;
const send = (msg) => api.runtime.sendMessage(msg);
const $ = (id) => document.getElementById(id);

const ORIGINS = { anthropic: 'https://api.anthropic.com/*', gemini: 'https://generativelanguage.googleapis.com/*' };

let settings = null;

function fill(st) {
  settings = st.settings;
  const s = settings;
  $('lang').value = s.lang;
  $('ratio').value = s.ratio;
  $('perSentence').checked = s.perSentence;
  $('perDay').value = s.perDay;
  $('skipSensitive').checked = s.skipSensitive;
  $('siteMode').value = s.sites.mode;
  $('siteListLabel').textContent = s.sites.mode === 'ask' ? 'Turned on' : 'Turned off';
  $('siteList').value = (s.sites.mode === 'ask' ? s.sites.allow : s.sites.deny).join('\n');
  $('tier').value = s.tier;
  $('cloudProvider').value = s.cloud.provider;
  $('cloudModel').value = s.cloud.model;
  $('cloudBase').value = s.cloud.baseUrl;
  $('baseRow').hidden = s.cloud.provider !== 'openai';
  $('cloudLimit').value = s.cloudLimit;
  $('key-out').textContent = st.hasKey ? 'A key is saved on this device.' : 'No key saved. Without one, the on-device checkers or the word rules are used.';
}

async function refresh() {
  fill(await send({ type: 'state' }));
}

async function patch(p) {
  await send({ type: 'settings', patch: p });
  await refresh();
}

$('lang').addEventListener('change', (e) => patch({ lang: e.target.value }));
$('ratio').addEventListener('change', (e) => patch({ ratio: Number(e.target.value) }));
$('perSentence').addEventListener('change', (e) => patch({ perSentence: e.target.checked }));
$('perDay').addEventListener('change', (e) => patch({ perDay: Number(e.target.value) }));
$('skipSensitive').addEventListener('change', (e) => patch({ skipSensitive: e.target.checked }));
$('tier').addEventListener('change', (e) => patch({ tier: e.target.value }));
$('cloudLimit').addEventListener('change', (e) => patch({ cloudLimit: Number(e.target.value) }));
$('cloudProvider').addEventListener('change', (e) => { $('baseRow').hidden = e.target.value !== 'openai'; patch({ cloud: { provider: e.target.value } }); });
$('cloudModel').addEventListener('change', (e) => patch({ cloud: { model: e.target.value.trim() } }));
$('cloudBase').addEventListener('change', (e) => patch({ cloud: { baseUrl: e.target.value.trim() } }));

$('siteMode').addEventListener('change', (e) => patch({ sites: { mode: e.target.value } }));
$('siteList').addEventListener('change', (e) => {
  const list = e.target.value.split('\n').map((l) => l.trim().toLowerCase().replace(/^www\./, '')).filter(Boolean);
  patch({ sites: settings.sites.mode === 'ask' ? { allow: list } : { deny: list } });
});

for (const b of document.querySelectorAll('[data-seed]')) {
  b.addEventListener('click', async () => {
    const r = await send({ type: 'seed', n: Number(b.dataset.seed) });
    $('seed-out').textContent = r.changed ? `${r.changed} words marked known.` : 'Nothing changed.';
  });
}

$('saveKey').addEventListener('click', async () => {
  const key = $('cloudKey').value.trim();
  const provider = $('cloudProvider').value;
  if (!provider) { $('key-out').textContent = 'Choose a provider first.'; return; }
  if (!key) { $('key-out').textContent = 'Paste a key first.'; return; }
  let origin = ORIGINS[provider];
  if (!origin) {
    try { const u = new URL($('cloudBase').value || 'https://api.openai.com/v1'); origin = `${u.protocol}//${u.host}/*`; } catch { $('key-out').textContent = 'The base URL is not a valid URL.'; return; }
  }
  // The permission prompt must come from this click, so it is requested here, not in the background.
  const granted = await api.permissions.request({ origins: [origin] }).catch(() => false);
  if (!granted) { $('key-out').textContent = `Access to ${origin} was not granted, so the key was not saved.`; return; }
  await send({ type: 'setKey', key });
  $('cloudKey').value = '';
  await refresh();
  $('key-out').textContent = 'Key saved on this device.';
});
$('clearKey').addEventListener('click', async () => { await send({ type: 'setKey', key: '' }); await refresh(); });

$('export').addEventListener('click', async () => {
  const data = await send({ type: 'export' });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `language-weave-${data.exportedAt.slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  $('data-out').textContent = 'Exported.';
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    await send({ type: 'import', data });
    await refresh();
    $('data-out').textContent = 'Imported.';
  } catch (err) {
    $('data-out').textContent = `Could not import: ${err.message}`;
  }
});
$('reset').addEventListener('click', async () => {
  if (!confirm(`Reset all progress for ${$('lang').selectedOptions[0].textContent}? This cannot be undone.`)) return;
  await send({ type: 'reset', lang: settings.lang });
  await refresh();
  $('data-out').textContent = 'Progress reset.';
});

refresh();
