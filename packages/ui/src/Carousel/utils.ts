export type { ScrollPosition } from '@studiometa/js-toolkit/utils';

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
