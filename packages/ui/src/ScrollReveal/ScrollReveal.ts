import {
  Base,
  useInView,
  useWindowScroll,
  type MountedReturn,
  type ScrollDirection,
} from '@studiometa/js-toolkit';
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
 * **v3 built this on `withMountWhenInView`, and v4 does not.** The decorator is
 * gone, and its two v4 successors each answer half of what this component
 * needs: `mountStrategy: 'visible'` mounts once and never unmounts, while
 * `'in-view'` mounts and unmounts on every crossing. `repeat` chooses between
 * exactly those two behaviours *at runtime*, from an attribute, and a mount
 * strategy is a static declaration — so the strategy cannot express this
 * option, and reaching for one would have meant deleting the option. The
 * component therefore mounts normally and subscribes to `useInView()`, the
 * core service the strategies are themselves built on, which also keeps the
 * `intersectionObserver` option meaningful: it is the observer's init, not a
 * `rootMargin` smuggled into a `data-mount` suffix.
 *
 * `data-mount="visible"` still composes on top for markup that wants the
 * instance itself deferred.
 *
 * v3's `$terminate()` after the one-shot reveal has no v4 equivalent either,
 * and needs none: the guard that made it necessary is a field, and it survives
 * the unmount/mount pair a DOM move now is.
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
   * v3 kept this in a `static` field fed by one `useScroll()` callback
   * registered under a fixed key and never removed, because a terminated
   * instance could not hold a subscription. A v4 service is shared and lazy —
   * one observer, one listener, however many subscribers — and this instance
   * lives for as long as its element, so the subscription is the component's
   * and is released with it.
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
   * not while the page is scrolling up — re-playing a reveal on the way back
   * up is the behaviour v3 spent its shared scroll subscription avoiding.
   */
  reveal(): void {
    if (this.__hasRevealed && (!this.$options.repeat || this.__directionY < 0)) {
      return;
    }

    this.__hasRevealed = true;
    void this.enter();
  }
}
