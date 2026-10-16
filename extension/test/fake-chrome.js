// A small stand-in for the chrome.* APIs the background uses. Storage is an in-memory object.
export function fakeChrome() {
  const store = {};
  const sent = [];
  const alarms = [];
  const listeners = { message: [], alarm: [], command: [], install: [] };
  const chrome = {
    _store: store,
    _sent: sent,
    _alarms: alarms,
    runtime: {
      getURL: (p) => `chrome-extension://test/${p}`,
      onMessage: { addListener: (fn) => listeners.message.push(fn) },
      onInstalled: { addListener: (fn) => listeners.install.push(fn) },
      lastError: null,
    },
    storage: {
      local: {
        accessLevel: null,
        setAccessLevel: async ({ accessLevel }) => { chrome.storage.local.accessLevel = accessLevel; },
        get: async (keys) => {
          if (keys == null) return { ...store };
          const list = Array.isArray(keys) ? keys : typeof keys === 'string' ? [keys] : Object.keys(keys);
          const out = {};
          for (const k of list) if (k in store) out[k] = structuredClone(store[k]);
          return out;
        },
        set: async (obj) => { for (const [k, v] of Object.entries(obj)) store[k] = structuredClone(v); },
        remove: async (keys) => { for (const k of Array.isArray(keys) ? keys : [keys]) delete store[k]; },
      },
    },
    alarms: {
      create: async (name, info) => { alarms.push({ name, info }); },
      onAlarm: { addListener: (fn) => listeners.alarm.push(fn) },
    },
    tabs: {
      _tabs: [{ id: 1, url: 'https://news.example/a' }, { id: 2, url: 'https://blog.example/b' }],
      query: async () => chrome.tabs._tabs,
      sendMessage: async (tabId, msg) => { sent.push({ tabId, msg }); },
    },
    commands: { onCommand: { addListener: (fn) => listeners.command.push(fn) } },
    permissions: { request: async () => true, contains: async () => true },
    _listeners: listeners,
  };
  return chrome;
}
