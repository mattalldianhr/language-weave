// Popup: the switches a reader reaches for most, and what the extension is doing right now.
const api = globalThis.chrome || globalThis.browser;
const send = (msg) => api.runtime.sendMessage(msg);
const $ = (id) => document.getElementById(id);

const TIER_TEXT = {
  llm: 'a language model (sense-checked)',
  translator: 'the browser translator (form-checked)',
  none: 'the word rules only (offline)',
};

// Slider position 1..100 maps to a ratio of 1 word in N, dense on the right.
const ratioFromSlider = (v) => Math.max(1, 101 - Number(v));
const sliderFromRatio = (r) => Math.max(1, Math.min(100, 101 - Number(r)));
const ratioText = (r) => (r === 1 ? 'every eligible word' : `1 word in ${r}`);

let tabUrl = '';

async function activeTabUrl() {
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    return tab?.url || '';
  } catch {
    return '';
  }
}

function render(st, cfg) {
  const s = st.settings;
  $('lang').value = s.lang;
  $('enabled').checked = s.enabled;
  $('ratio').value = sliderFromRatio(s.ratio);
  $('ratio-out').textContent = ratioText(s.ratio);
  $('perday').value = s.perDay;
  const host = (() => { try { return new URL(tabUrl).hostname.replace(/^www\./, ''); } catch { return ''; } })();
  $('site-label').textContent = host ? `On ${host}` : 'On this site';
  $('site').disabled = !host;
  $('site').checked = Boolean(cfg?.enabled || (cfg?.reason && cfg.reason !== 'site'));
  const reason = $('reason');
  const why = { off: '', site: '', route: 'Paused on this page: it looks like a sign-in, checkout, or account page.', sensitive: 'Paused on this page: health, money, and mail stay in English.', pack: 'This language pack could not be loaded.' }[cfg?.reason] || '';
  reason.hidden = !why;
  reason.textContent = why;
  $('tier').textContent = TIER_TEXT[st.tier] || TIER_TEXT.none;
  const p = st.providers || {};
  const parts = [];
  parts.push(p.nano === 'available' ? 'On-device model ready.' : p.nano === 'downloadable' ? 'On-device model can be downloaded (Chrome settings).' : 'No on-device model on this machine.');
  parts.push(p.translator === 'available' ? 'Translator ready.' : 'Translator not available.');
  if (p.cloud) parts.push(`Cloud key set (${st.quota.cloud.used} of ${st.quota.cloud.limit} calls today).`);
  else if (st.hasKey) parts.push('Cloud key set, but no provider chosen in settings.');
  $('providers').textContent = parts.join(' ');
  const sum = st.summary;
  if (sum) {
    $('counts').textContent = `${sum.learning} learning · ${sum.shaky} shaky · ${sum.known} known`;
    const ol = $('words');
    ol.replaceChildren(...sum.today.map((w) => {
      const li = document.createElement('li');
      const t = document.createElement('span'); t.className = 't'; t.textContent = w.target;
      const e = document.createElement('span'); e.textContent = w.key.split('|')[0];
      const st2 = document.createElement('span'); st2.className = 's'; st2.textContent = `${w.status} · ${w.seen}×`;
      li.append(t, e, st2);
      return li;
    }));
    if (!sum.today.length) {
      const li = document.createElement('li');
      li.className = 'note';
      li.textContent = 'No words met yet today. Open any article.';
      ol.replaceChildren(li);
    }
  }
  $('version').textContent = `v${api.runtime.getManifest().version}`;
  document.getElementById('app').setAttribute('aria-busy', 'false');
}

async function refresh() {
  tabUrl = await activeTabUrl();
  const [st, cfg] = await Promise.all([send({ type: 'state' }), tabUrl ? send({ type: 'config', url: tabUrl }) : null]);
  render(st, cfg);
}

$('lang').addEventListener('change', async (e) => { await send({ type: 'settings', patch: { lang: e.target.value } }); refresh(); });
$('enabled').addEventListener('change', async (e) => { await send({ type: 'toggle', enabled: e.target.checked }); refresh(); });
$('site').addEventListener('change', async (e) => { await send({ type: 'site', url: tabUrl, enabled: e.target.checked }); refresh(); });
$('ratio').addEventListener('input', (e) => { $('ratio-out').textContent = ratioText(ratioFromSlider(e.target.value)); });
$('ratio').addEventListener('change', async (e) => { await send({ type: 'settings', patch: { ratio: ratioFromSlider(e.target.value) } }); refresh(); });
$('perday').addEventListener('change', async (e) => { await send({ type: 'settings', patch: { perDay: Number(e.target.value) } }); refresh(); });
$('options').addEventListener('click', (e) => { e.preventDefault(); api.runtime.openOptionsPage(); });

refresh().catch((e) => { $('tier').textContent = `Could not reach the extension: ${e.message}`; });
