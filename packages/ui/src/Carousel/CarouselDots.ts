import { type BaseConfig, type BaseProps, type MountedReturn } from '@studiometa/js-toolkit';
import type { RefEvent } from '@studiometa/js-toolkit';
import { withTransition, type TransitionProps } from '../decorators/withTransition.js';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';
import type { CarouselState } from './context.js';
import { hasAccessibleName } from './utils.js';

export type CarouselDotsProps = TransitionProps & {
  $refs: {
    /** One `<button>` per slide, in slide order. */
    dots: HTMLButtonElement[];
  };
};

/**
 * The pagination dots: one `<button>` per slide, marking the one showing.
 *
 * **One component over the whole list, not one per dot.** A dot has no state
 * of its own — its name and its marker are both functions of its position in
 * the list and of the carousel's index — so the list is the unit, and an author
 * writes `data-ref="dots[]"` rather than `data-option-action="0"`, `"1"`,
 * `"2"`… on each button. Adding a slide then means adding a dot, and nothing
 * has to be renumbered.
 *
 * **They are plain buttons.** No `role="tablist"`, no `role="tab"`, no
 * `aria-selected`. The APG's carousel pattern prescribes tab semantics for a
 * "tabbed carousel", and every piece of user testing published since
 * contradicts it — the objection has been open on the APG repository,
 * unanswered, for eight years. Tab semantics also promise a keyboard contract
 * this widget does not honour: `role="tab"` announces arrow-key navigation and
 * a roving `tabindex`, and a set of dots that announces arrow keys and then
 * ignores them is worse than one that never claimed them.
 *
 * **The marker is `aria-current`, never `disabled`.** `disabled` takes a
 * control out of the tab order and the accessibility tree, so the set of dots
 * would silently lose one every time the carousel moved. `aria-current="true"`
 * says "this is the one you are on" without removing anything, and it is the
 * CSS hook as well: style `[aria-current='true']`. Every picker carries it —
 * {@link CarouselThumbnails} and a numeric {@link CarouselBtn} included — so
 * one selector styles the current control whichever kind it is.
 *
 * **Every dot is named.** A dot with nothing but a background colour is a tab
 * stop with no name — the single most common carousel defect an audit finds.
 * A dot the author named keeps its name; every other one gets the carousel's
 * own `slide-label`, so the dots and the slides read the same and translate
 * through the same option.
 *
 * @link https://ui.studiometa.dev/reference/items/Carousel/js-api#carouseldots
 */
export class CarouselDots<T extends BaseProps = BaseProps> extends withTransition(
  AbstractCarouselChild,
)<CarouselDotsProps & T> {
  static config: BaseConfig = {
    name: 'CarouselDots',
    refs: ['dots[]'],
  };

  /**
   * The index the transition last ran for. `-1` until the first update, which
   * is why the enter/leave pair below is guarded — v1 hands the resulting
   * `undefined` to its transition util, which throws.
   */
  currentIndex = -1;

  /**
   * The dots this component named and the attributes it wrote, so the teardown
   * gives back exactly what it took and a re-name never mistakes a generated
   * name for the author's.
   * @private
   */
  __owned = new WeakSet<HTMLElement>();

  /** Every dot. `withTransition` overrides it with a single one per call. */
  get target(): HTMLButtonElement[] {
    return this.$refs.dots;
  }

  mounted(): MountedReturn {
    return [
      super.mounted(),
      () => {
        this.currentIndex = -1;

        for (const dot of this.$refs.dots) {
          dot.removeAttribute('aria-current');

          if (this.__owned.has(dot)) {
            dot.removeAttribute('aria-label');
            this.__owned.delete(dot);
          }
        }
      },
    ];
  }

  /**
   * Mark the current dot, name every dot, and transition the pair that changed.
   *
   * The naming pass runs on every update rather than only when the index
   * moves: `total` is the live slide count, so appending a slide has to rewrite
   * "3 of 4" into "3 of 5" on every dot. The transition only runs when the
   * index actually changed, so a slide arriving does not re-animate the list.
   */
  update({ index, total }: CarouselState): void {
    const { dots } = this.$refs;
    const { carousel } = this;

    for (const [position, dot] of dots.entries()) {
      if (position === index) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }

      if (carousel && (this.__owned.has(dot) || !hasAccessibleName(dot))) {
        dot.setAttribute('aria-label', carousel.slideLabel(position, total));
        this.__owned.add(dot);
      }
    }

    if (index === this.currentIndex) {
      return;
    }

    const previous = dots[this.currentIndex];
    const next = dots[index];
    this.currentIndex = index;

    if (previous) {
      void this.leave(previous);
    }

    if (next) {
      void this.enter(next);
    }
  }

  /**
   * Go to the slide the dot names.
   *
   * The carousel is resolved through the context on the event path, so a dots
   * list that has been moved out of a carousel — or was never inside one — is
   * inert rather than throwing.
   */
  onDotsClick({ index }: RefEvent<HTMLButtonElement>): void {
    this.carousel?.goTo(index);
  }
}
