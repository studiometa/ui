import { createContext, type Signal } from '@studiometa/js-toolkit';
import type { IndexableInstruction } from '../Indexable/Indexable.js';
import type { ScrollPosition } from './utils.js';

/** What every Carousel control reads. */
export interface CarouselState {
  index: number;
  total: number;
  prevIndex: number;
  nextIndex: number;
  isHorizontal: boolean;
}

/**
 * The surface a `Carousel` exposes to its children.
 *
 * It is a curated object rather than the instance, so no control imports the
 * `Carousel` class — the shape §4c of the report calls the one every control
 * should have. `indexOf` takes an **element** for the same reason: an item
 * asking for its own position must not have to name a class to do it.
 */
export interface CarouselApi {
  state: Signal<CarouselState>;
  /**
   * The carousel's own element.
   *
   * Exposed for one job: the scroll track has to mirror the carousel's
   * accessible name when it becomes a tab stop of its own, and a name cannot
   * be invented. It is the element, not the instance, so this stays a data
   * surface rather than a back door onto the class.
   */
  el: HTMLElement;
  goTo(indexOrInstruction: number | IndexableInstruction): void;
  goNext(): void;
  goPrev(): void;
  /** The item's position among its siblings, or `-1`. */
  indexOf(element: Element): number;
  /**
   * The accessible name for the slide at `index`, built from the carousel's
   * `slide-label` option. Both arguments are zero-based counts the caller
   * already holds, so no control has to reach back for the total.
   */
  slideLabel(index: number, total: number): string;
  /** The centred scroll offset of every item, in DOM order. */
  positions(): ScrollPosition[];
  /** Report an index reached by scrolling. Never scrolls back. */
  reportIndex(index: number): void;
  /** Ask the carousel to keep publishing its progress. */
  keepTicking(): void;
}

export const CarouselContext = /* @__PURE__ */ createContext<CarouselApi>('carousel');
