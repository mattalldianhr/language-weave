// Chrome Prompt API (Gemini Nano) as the on-device LLM verifier.
import { buildVerifyPrompt, parseVerdicts } from '../shared/prompt.js';

export function createPromptApiProvider({ LanguageModel = globalThis.LanguageModel } = {}) {
  let session = null;

  async function availability() {
    if (!LanguageModel || typeof LanguageModel.availability !== 'function') return 'unavailable';
    try {
      const a = await LanguageModel.availability();
      if (a === 'available') return 'available';
      if (a === 'downloadable' || a === 'downloading') return 'downloadable';
      return 'unavailable';
    } catch {
      return 'unavailable';
    }
  }

  async function getSession() {
    if (!session) session = await LanguageModel.create();
    return session;
  }

  function reset() {
    try { session?.destroy?.(); } catch { /* ignore */ }
    session = null;
  }

  async function ask(prompt) {
    try {
      return await (await getSession()).prompt(prompt);
    } catch (e) {
      // Context overflow or quota: start a fresh session once.
      reset();
      return (await getSession()).prompt(prompt);
    }
  }

  async function verify(request) {
    const prompt = buildVerifyPrompt(request);
    let text;
    try {
      text = await ask(prompt);
    } catch (e) {
      reset();
      throw e;
    }
    return parseVerdicts(text, request);
  }

  return { name: 'prompt-api', availability, verify, reset };
}
