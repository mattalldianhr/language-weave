// Cloud LLM adapters behind one interface: Anthropic, Gemini, and any OpenAI-compatible endpoint.
// The key never leaves the background; only the sentences holding candidates are sent.
import { buildVerifyPrompt, parseVerdicts } from '../shared/prompt.js';

export const DEFAULT_MODELS = {
  anthropic: 'claude-haiku-5-5',
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
};
const DEFAULT_BASE = {
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com',
  openai: 'https://api.openai.com/v1',
};

export class ProviderError extends Error {
  constructor(message, { status = 0, retryAfterMs = 0 } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function originPattern(url) {
  const u = new URL(url);
  return `${u.protocol}//${u.host}/*`;
}

function retryAfter(res, bodyText) {
  const h = Number(res.headers?.get?.('retry-after'));
  if (h > 0) return h * 1000;
  const m = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(bodyText || '');
  return m ? Number(m[1]) * 1000 : 0;
}

export function createCloudProvider({ provider, key, baseUrl = '', model = '', fetch = globalThis.fetch, timeoutMs = 30000 } = {}) {
  if (!DEFAULT_MODELS[provider]) throw new Error(`unknown provider ${provider}`);
  const base = (baseUrl || DEFAULT_BASE[provider]).replace(/\/+$/, '');
  const modelName = model || DEFAULT_MODELS[provider];

  const request = (prompt) => {
    switch (provider) {
      case 'anthropic':
        return {
          url: `${base}/v1/messages`,
          headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: { model: modelName, max_tokens: 2048, messages: [{ role: 'user', content: prompt }] },
          text: (j) => (j.content || []).filter((p) => p.type === 'text').map((p) => p.text).join(''),
        };
      case 'gemini':
        return {
          url: `${base}/v1beta/models/${modelName}:generateContent`,
          headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          body: { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } },
          text: (j) => (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join(''),
        };
      default:
        return {
          url: `${base}/chat/completions`,
          headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
          body: { model: modelName, temperature: 0, messages: [{ role: 'user', content: prompt }] },
          text: (j) => j.choices?.[0]?.message?.content || '',
        };
    }
  };

  async function availability() {
    return key ? 'available' : 'unavailable';
  }

  async function verify(req) {
    const prompt = buildVerifyPrompt(req);
    const r = request(prompt);
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    let res;
    try {
      res = await fetch(r.url, { method: 'POST', headers: r.headers, body: JSON.stringify(r.body), signal: controller?.signal });
    } catch (e) {
      throw new ProviderError(`network: ${e.message}`);
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      throw new ProviderError(`${provider} ${res.status}`, { status: res.status, retryAfterMs: retryAfter(res, bodyText) });
    }
    const json = await res.json();
    return parseVerdicts(r.text(json), req);
  }

  return { name: provider, availability, verify, origin: originPattern(base), model: modelName };
}
