import { Base } from '@studiometa/js-toolkit/Base';
import { useInView } from '@studiometa/js-toolkit/useInView';
import { useWindowScroll } from '@studiometa/js-toolkit/useWindowScroll';
import type { MountedReturn, ScrollDirection } from '@studiometa/js-toolkit';
import { withTransition, type TransitionProps } from '../decorators/withTransition.js';

export type ScrollRevealProps = TransitionProps & {
  $refs: {
    target?: HTMLElement;
  };
  $options: {
    /** Reveal again on every entry, instead of once. */
    repeat: boolean;
    /** Observer options, passed straight to `useInView()`. */
    intersectionObserver: IntersectionObserverInit;
  };
};

/**
 * Plays an enter transition when its element scrolls into view.
 *
 * Reveals its `target` ref, or its own element, once — or on every entry with
 * the `repeat` option, skipping the entries that happen while the page is
 * scrolling back up.
 *
 * **No mount strategy, on purpose.** `mountStrategy: 'visible'` mounts once
 * and never unmounts, while `'in-view'` mounts and unmounts on every crossing;
 * `repeat` chooses between exactly those two behaviours *at runtime*, from an
 * attribute, and a mount strategy is a static declaration. The component
 * therefore mounts normally and subscribes to `useInView()`, the core service
 * the strategies are themselves built on, which also keeps the
 * `intersectionObserver` option meaningful: it is the observer's init, not a
 * `rootMargin` smuggled into a `data-mount` suffix.
 *
 * `data-mount="visible"` still composes on top for markup that wants the
 * instance itself deferred.
 *
 * @link https://ui.studiometa.dev/reference/items/ScrollReveal/
 */
export class ScrollReveal extends withTransition(Base)<ScrollRevealProps> {
  static config = {
    name: 'ScrollReveal',
    refs: ['target'],
    options: {
      enterKeep: { type: Boolean, default: true },
      repeat: Boolean,
      intersectionObserver: { type: Object, default: () => ({ threshold: [0, 1] }) },
    },
  };

  /**
   * Whether the reveal already ran once.
   * @private
   */
  __hasRevealed = false;

  /**
   * The page's latest vertical scroll direction, tracked only when `repeat` is
   * set.
   *
   * The subscription is the instance's own and is released with it: the
   * service behind it is shared and lazy, so a page of a thousand reveals
   * still costs one listener.
   * @private
   */
  __directionY: ScrollDirection = 0;

  /** What the enter transition runs on. */
  get target(): HTMLElement {
    return this.$refs.target ?? this.$el;
  }

  mounted(): MountedReturn {
    const cleanups: MountedReturn[] = [];

    if (this.$options.repeat) {
      cleanups.push(
        useWindowScroll().subscribe(({ directionY }) => {
          this.__directionY = directionY;
        }),
      );
    }

    cleanups.push(
      useInView(this.$el, this.$options.intersectionObserver).subscribe(({ isInView }) => {
        if (isInView) {
          this.reveal();
        }
      }),
    );

    return cleanups;
  }

  /**
   * Run the enter transition, unless this entry should be ignored.
   *
   * The first entry always reveals. Later ones only do so with `repeat`, and
   * not while the page is scrolling up: an element re-entering from below has
   * already been seen, so replaying its reveal reads as a glitch.
   */
  reveal(): void {
    if (this.__hasRevealed && (!this.$options.repeat || this.__directionY < 0)) {
      return;
    }

    this.__hasRevealed = true;
    void this.enter();
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/ScrollReveal`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default ScrollReveal;
