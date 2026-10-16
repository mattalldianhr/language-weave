// Gloss, flip, and the seen / peek / flip events. Only trusted input on spans this extension made
// produces an event, so pages cannot forge progress.
import { SWAP_CLASS } from './paint.js';

export const TIP_DELAY_MS = 700; // a beat to recall the word before the meaning appears (spec §6)

export function createInteraction({ doc, send, delay = TIP_DELAY_MS }) {
  let timer = null;
  let tipped = null;
  const seenToday = new Set(); // key -> seen sent this page load (background dedupes per day)

  const spanOf = (e) => (e.isTrusted && e.target?.closest ? e.target.closest(`.${SWAP_CLASS}`) : null);

  function hideTip() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (tipped) tipped.classList.remove('lw-tip');
    tipped = null;
  }

  function showTip(span, { peek }) {
    hideTip();
    span.classList.add('lw-tip');
    tipped = span;
    if (peek) send({ type: 'event', key: span.getAttribute('data-key'), event: 'peek' });
  }

  function enter(e) {
    const span = spanOf(e);
    if (!span || span === tipped) return;
    if (timer) clearTimeout(timer);
    if (span.hasAttribute('data-first')) {
      showTip(span, { peek: false }); // first encounter: gloss at once, no retrieval trial
      return;
    }
    const peek = e.type === 'mouseover'; // a page can focus a span from script, so focus never counts
    timer = setTimeout(() => showTip(span, { peek }), delay);
  }

  function leave(e) {
    const span = spanOf(e);
    if (!span) return;
    hideTip();
  }

  function flip(span) {
    if (span.classList.contains('lw-flipped')) {
      span.textContent = span.getAttribute('data-form');
      span.classList.remove('lw-flipped');
      return;
    }
    span.textContent = span.getAttribute('data-en');
    span.classList.add('lw-flipped');
    hideTip();
    send({ type: 'event', key: span.getAttribute('data-key'), event: 'flip' });
  }

  function click(e) {
    const span = spanOf(e);
    if (!span) return;
    e.preventDefault();
    e.stopPropagation();
    flip(span);
  }

  function key(e) {
    const span = spanOf(e);
    if (!span) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flip(span);
    } else if (e.key === 'Escape') hideTip();
  }

  const visible = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const span = en.target;
      const k = span.getAttribute('data-key');
      if (!k || seenToday.has(k)) continue;
      seenToday.add(k);
      send({ type: 'event', key: k, event: 'seen' });
    }
  }, { threshold: 0.5 });

  function watch(span) {
    visible.observe(span);
  }

  function attach() {
    doc.addEventListener('mouseover', enter, true);
    doc.addEventListener('focusin', enter, true);
    doc.addEventListener('mouseout', leave, true);
    doc.addEventListener('focusout', leave, true);
    doc.addEventListener('click', click, true);
    doc.addEventListener('keydown', key, true);
  }

  function detach() {
    doc.removeEventListener('mouseover', enter, true);
    doc.removeEventListener('focusin', enter, true);
    doc.removeEventListener('mouseout', leave, true);
    doc.removeEventListener('focusout', leave, true);
    doc.removeEventListener('click', click, true);
    doc.removeEventListener('keydown', key, true);
    hideTip();
    visible.disconnect();
    seenToday.clear();
  }

  return { attach, detach, watch, hideTip };
}
