// Service worker entry (Chrome) and event page entry (Firefox): wires chrome.* to the service.
import { createService } from './background/service.js';
import { createTranslatorProvider } from './providers/translator.js';
import { createPromptApiProvider } from './providers/prompt-api.js';
import { createCloudProvider } from './providers/cloud.js';

const api = globalThis.chrome || globalThis.browser;

async function loadPack(lang) {
  const res = await fetch(api.runtime.getURL(`packs/${lang}.json`));
  if (!res.ok) throw new Error(`pack ${lang}: ${res.status}`);
  return res.json();
}

const service = createService({
  chrome: api,
  providers: {
    translator: createTranslatorProvider(),
    promptApi: createPromptApiProvider(),
    cloud: (cfg) => createCloudProvider(cfg),
  },
  loadPack,
});

const ready = service.init().catch((e) => console.error('[language-weave] init failed', e));

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  ready
    .then(() => service.handle(msg, sender))
    .then(sendResponse, (e) => sendResponse({ ok: false, error: String(e?.message || e) }));
  return true; // async reply
});

api.alarms.onAlarm.addListener((alarm) => { ready.then(() => service.onAlarm(alarm.name)); });
api.commands?.onCommand.addListener((name) => { ready.then(() => service.onCommand(name)); });
api.runtime.onInstalled.addListener(() => { ready.then(() => api.alarms.create('daily', { periodInMinutes: 60 })); });
