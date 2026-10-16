// Page scanning: which blocks to read, and how to flatten a block into text with a map back to
// its text nodes. Swaps are only ever made inside one text node.

export const BLOCKS = 'p, li, blockquote, h1, h2, h3, h4, dd, dt, figcaption, td, th';
export const BLOCKED = [
  'a', 'button', 'input', 'textarea', 'select', 'option', 'form', 'nav', 'header', 'footer', 'code', 'pre', 'kbd', 'samp',
  'script', 'style', 'noscript', 'svg', 'math', 'iframe', 'video', 'audio', 'canvas',
  '[contenteditable]:not([contenteditable="false"])', '[role="textbox"]', '[role="button"]', '[role="link"]', '[role="menu"]',
  '[hidden]', '[aria-hidden="true"]', '[translate="no"]', '.notranslate', '.lw-swap',
].join(',');

export const MIN_WORDS = 4;

function langOk(el) {
  const lang = (el.closest('[lang]')?.getAttribute('lang') || '').toLowerCase();
  return !lang || lang === 'en' || lang.startsWith('en-');
}

export function isBlock(el) {
  if (!el || el.nodeType !== 1 || !el.isConnected) return false;
  if (!el.matches(BLOCKS)) return false;
  if (el.closest(BLOCKED)) return false;
  if (!langOk(el)) return false;
  if (el.querySelector(BLOCKS)) return false; // nested block: let the inner one own its text
  return true;
}

export function collectBlocks(root) {
  const out = [];
  if (root.nodeType === 1 && isBlock(root)) out.push(root);
  if (root.querySelectorAll) for (const el of root.querySelectorAll(BLOCKS)) if (isBlock(el)) out.push(el);
  return out;
}

// Text nodes under `el` that may be rewritten: not inside a blocked element, not whitespace-only.
export function textNodes(el, doc = el.ownerDocument) {
  const walker = doc.createTreeWalker(el, 4 /* SHOW_TEXT */, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return 2; // REJECT
      const parent = node.parentElement;
      // A block is never inside a blocked element (isBlock), so any blocked ancestor of the text
      // node sits inside the block: links, code, buttons, editable regions.
      if (parent && parent !== el && parent.closest(BLOCKED)) return 2;
      return 1; // ACCEPT
    },
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

// {text, segments: [{node, start, end}]} where text is the block's readable text with a single
// space between nodes, and each segment maps a text range to one text node (offsets inside the node
// equal text offset minus segment start).
export function flatten(el) {
  const nodes = textNodes(el);
  let text = '';
  const segments = [];
  for (const node of nodes) {
    const value = node.nodeValue;
    if (text && !/\s$/.test(text) && !/^\s/.test(value)) text += ' ';
    const start = text.length;
    text += value;
    segments.push({ node, start, end: start + value.length });
  }
  return { text, segments };
}

// The segment that wholly contains [start, end), or null.
export function segmentFor(segments, start, end) {
  for (const s of segments) if (start >= s.start && end <= s.end) return s;
  return null;
}
