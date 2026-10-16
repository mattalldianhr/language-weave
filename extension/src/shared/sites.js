// Site, route, and sensitive-topic rules. Pure.

export function hostOf(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

const matches = (list, host) => list.some((h) => host === h || host.endsWith('.' + h));

export function siteEnabled(sites, url) {
  const host = hostOf(url);
  if (!host) return false;
  if (sites.mode === 'ask') return matches(sites.allow || [], host);
  return !matches(sites.deny || [], host);
}

export function setSite(sites, url, enabled) {
  const host = hostOf(url);
  if (!host) return sites;
  const without = (list) => (list || []).filter((h) => h !== host);
  if (sites.mode === 'ask') {
    return { ...sites, allow: enabled ? [...without(sites.allow), host] : without(sites.allow) };
  }
  return { ...sites, deny: enabled ? without(sites.deny) : [...without(sites.deny), host] };
}

const ROUTE = /(^|\/)(login|log-in|signin|sign-in|signup|sign-up|checkout|cart|billing|payment|payments|account|accounts|bank|banking|password|reset)(\/|$|\?|#)/i;

export function routeBlocked(url) {
  try {
    return ROUTE.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

const SENSITIVE_HOST = /(^|\.)(webmd|mayoclinic|nih|nhs|healthline|drugs|medlineplus|cdc|who|patient|paypal|venmo|chase|wellsfargo|bankofamerica|citi|fidelity|vanguard|schwab|robinhood|coinbase|turbotax|irs|mail\.google|outlook\.live|mail\.yahoo|mail\.proton)\.[a-z.]+$/i;
const SENSITIVE_PATH = /(^|\/)(health|medical|symptom|symptoms|diagnosis|cancer|therapy|mental-health|pregnancy|finance|finances|tax|taxes|loan|loans|mortgage|insurance|invest|investing|crypto|wallet|inbox|mail)(\/|$|-)/i;

export function sensitiveUrl(url) {
  try {
    const u = new URL(url);
    return SENSITIVE_HOST.test(u.hostname) || SENSITIVE_PATH.test(u.pathname);
  } catch {
    return false;
  }
}
