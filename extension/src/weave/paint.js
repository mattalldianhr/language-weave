// Painting swaps into the DOM and restoring them. One swap lives inside one text node.
import { segmentFor } from './scan.js';

export const SWAP_CLASS = 'lw-swap';

// Replaces [start, end) of the block text with a span showing `form`. Returns the span, or null
// when the range crosses a text-node boundary or the node has changed since flattening.
export function paintSwap(doc, segments, swap) {
  const seg = segmentFor(segments, swap.start, swap.end);
  if (!seg || !seg.node.isConnected) return null;
  const node = seg.node;
  const a = swap.start - seg.start;
  const b = swap.end - seg.start;
  const value = node.nodeValue;
  if (value.slice(a, b) !== swap.english) return null; // the page changed under us
  const span = doc.createElement('span');
  span.className = SWAP_CLASS;
  span.textContent = swap.form;
  span.setAttribute('data-en', swap.english);
  span.setAttribute('data-key', swap.key);
  span.setAttribute('data-form', swap.form);
  span.setAttribute('data-gloss', swap.gloss || swap.english);
  if (swap.first) span.setAttribute('data-first', '1');
  span.setAttribute('tabindex', '0');
  span.setAttribute('role', 'button');
  span.setAttribute('aria-label', `${swap.form}, ${swap.english}`);
  span.setAttribute('translate', 'no');
  const after = node.splitText(a);
  after.nodeValue = after.nodeValue.slice(b - a);
  node.parentNode.insertBefore(span, after);
  // The remainder of this text node now lives in `after`; re-point the segment at it so a later
  // swap in the same node (swaps are painted in document order) still lands.
  seg.node = after;
  seg.start = swap.end;
  return span;
}

// Paints swaps in document order; swaps that cannot be placed are skipped. Returns the spans.
export function paintAll(doc, segments, swaps) {
  const spans = [];
  const sorted = [...swaps].sort((x, y) => x.start - y.start);
  for (const s of sorted) {
    const span = paintSwap(doc, segments, s);
    if (span) spans.push(span);
  }
  return spans;
}

// Puts the English back for one span and merges the text nodes around it.
export function unpaint(span) {
  if (!span.isConnected) return;
  const parent = span.parentNode;
  const text = span.ownerDocument.createTextNode(span.getAttribute('data-en') || span.textContent);
  parent.replaceChild(text, span);
  parent.normalize();
}

export function unpaintAll(root) {
  for (const span of [...root.querySelectorAll(`.${SWAP_CLASS}`)]) unpaint(span);
}
