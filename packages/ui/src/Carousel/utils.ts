import { SCROLL_ALIGNMENTS, type ScrollAlign } from '@studiometa/js-toolkit/utils';

export type { ScrollPosition } from '@studiometa/js-toolkit/utils';

/**
 * The three `scroll-snap-align` keywords that name a position, mapped onto the
 * scroll alignment that lands on the same place. The fourth, `none`, names no
 * position and so has no entry.
 */
const SNAP_ALIGNMENTS: Record<string, ScrollAlign> = {
  start: SCROLL_ALIGNMENTS.start,
  center: SCROLL_ALIGNMENTS.center,
  end: SCROLL_ALIGNMENTS.end,
};

/**
 * Where a slide should come to rest, read from its own `scroll-snap-align`.
 *
 * The alignment is the author's, declared in CSS, so a programmatic `goTo()`
 * lands exactly where a native snap would and the two never disagree. Reading
 * it is what keeps the scroll target and the CSS one decision instead of two.
 *
 * `scroll-snap-align` takes one or two keywords, block axis first, and the
 * computed value serialises the same way in every engine. One keyword applies
 * to both axes. `none` opts a slide out of snapping and names no position, so
 * it falls back to `center` — the alignment this carousel used before it read
 * the CSS at all, and the one that behaves best for a track of slides narrower
 * than their scrollport.
 *
 * Block and inline are mapped to y and x, which holds for `horizontal-tb`. A
 * vertical writing mode would swap them; no carousel in the wild is built that
 * way, and guessing at it would cost a `writing-mode` read per slide.
 */
export function snapAlignment(element: HTMLElement): { x: ScrollAlign; y: ScrollAlign } {
  const [block, inline = block] = window
    .getComputedStyle(element)
    .scrollSnapAlign.trim()
    .split(/\s+/);

  return {
    x: SNAP_ALIGNMENTS[inline] ?? SCROLL_ALIGNMENTS.center,
    y: SNAP_ALIGNMENTS[block] ?? SCROLL_ALIGNMENTS.center,
  };
}

/**
 * Everything the platform can focus without an author saying so, plus the two
 * ways an author says so: `tabindex` and `contenteditable`.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'audio[controls]',
  'button',
  'details',
  'embed',
  'iframe',
  'input',
  'object',
  'select',
  'textarea',
  'video[controls]',
  '[contenteditable]',
  '[tabindex]',
].join(',');

/**
 * Whether an element is in the page's tab sequence, as far as attributes can
 * tell.
 *
 * Deliberately attribute-only: `display: none` and `visibility: hidden` also
 * remove an element from the sequence, and finding out costs a computed style
 * per candidate. The one caller runs on every structural change, so the price
 * would be paid for a case — a carousel whose only focusable content is
 * display-none — that no markup this component ships produces.
 */
function isTabbable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled') || element.hidden || element.inert) {
    return false;
  }

  const tabIndex = element.getAttribute('tabindex');

  return tabIndex === null || Number(tabIndex) >= 0;
}

/**
 * Whether anything inside `root` is a tab stop of its own.
 *
 * This is the runtime probe behind the scroll container's own focusability.
 * Chrome makes a scroller focusable only when it has no focusable children,
 * and no markup can promise that ahead of time: a slide holds arbitrary
 * content, and content arrives and leaves after mount.
 *
 * A link inside a slide this component made `inert` still counts, on purpose:
 * the probe asks whether the carousel's content is tabbable *at all*, not
 * whether it happens to be tabbable at the current scroll offset. Skipping it
 * would tie the track's tab stop to the scroll position — appearing and
 * disappearing as the user scrolls past a slide holding a link — and a tab
 * order that changes under the user is its own accessibility failure. An
 * element an *author* marked `inert` is skipped, because that one never
 * becomes tabbable again on its own.
 */
export function hasTabbableDescendant(root: Element): boolean {
  for (const element of root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) {
    if (isTabbable(element)) {
      return true;
    }
  }

  return false;
}

/**
 * Whether a control already carries a name of the author's.
 *
 * The question the two pickers ask before writing a positional `aria-label`:
 * an author's own name always wins, and a generated one must never overwrite
 * a real caption.
 *
 * It walks the subtree rather than reading `textContent`, because the two
 * shapes a picker actually ships in are exactly the ones `textContent` gets
 * wrong. A dot is `<button><span aria-hidden="true">●</span></button>`, whose
 * `textContent` is a bullet and whose accessible name is empty — the
 * accessible-name algorithm skips an `aria-hidden` subtree, so reading the raw
 * text would leave that dot unnamed. A thumbnail is `<button><img alt="Red
 * dress, front"></button>`, whose `textContent` is empty and whose accessible
 * name is the `alt` — reading the raw text would overwrite a real caption with
 * "3 of 5".
 *
 * `svg > title` is not counted: its contribution to the name is inconsistent
 * across engines, so a `<title>`-only control gets the positional fallback as
 * well, which is the safe direction to be wrong in.
 */
export function hasAccessibleName(el: Element): boolean {
  if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) {
    return true;
  }

  return hasNameableContent(el);
}

/**
 * Whether anything inside contributes to the accessible name.
 */
function hasNameableContent(el: Element): boolean {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) {
        return true;
      }
      continue;
    }

    if (!(node instanceof Element) || node.getAttribute('aria-hidden') === 'true') {
      continue;
    }

    if (node.hasAttribute('aria-label') || node.hasAttribute('aria-labelledby')) {
      return true;
    }

    if (node instanceof HTMLImageElement && node.alt.trim()) {
      return true;
    }

    if (hasNameableContent(node)) {
      return true;
    }
  }

  return false;
}

/** The index of the number closest to the target. */
export function getClosestIndex(numbers: number[], target: number): number {
  let index = 0;
  let min = Number.POSITIVE_INFINITY;
  let closestIndex = 0;

  for (const number of numbers) {
    const absoluteDiff = Math.abs(number - target);

    if (absoluteDiff < min) {
      closestIndex = index;
      min = absoluteDiff;
    }

    index += 1;
  }

  return closestIndex;
}
