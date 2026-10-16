// Content scripts cannot be ES modules, so this classic script pulls the module in.
(async () => {
  try {
    const api = globalThis.chrome || globalThis.browser;
    await import(api.runtime.getURL('src/content.js'));
  } catch (e) {
    console.error('[language-weave] failed to load', e);
  }
})();
