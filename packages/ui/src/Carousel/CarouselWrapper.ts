import {
  usePrefersReducedMotion,
  withResize,
  type BaseConfig,
  type BaseProps,
  type MountedReturn,
} from '@studiometa/js-toolkit';
import { clamp } from '@studiometa/js-toolkit/utils';
import { AbstractCarouselComponent } from './AbstractCarouselComponent.js';
import { getClosestIndex, hasTabbableDescendant } from './utils.js';

/** The four sides `scroll-padding` is mirrored on, in `scroll-padding-*` order. */
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

/**
 * The scrollable track.
 *
 * It scrolls to an item on demand through `scrollToIndex()`, which the
 * coordinator calls, and on a native or touch scroll it only **reports** the
 * closest item back. Because a scroll is only ever started by `goTo()` and
 * `onScroll` never scrolls, the feedback loop that would hijack a smooth
 * scroll cannot form and no synchronising guard is needed.
 */
export class CarouselWrapper<T extends BaseProps = BaseProps> extends withResize(
  AbstractCarouselComponent,
)<T> {
  static config: BaseConfig = {
    name: 'CarouselWrapper',
  };

  /**
   * `scrollWidth - clientWidth` and its vertical twin. `progress` runs every
   * frame, so these layout reads are cached and cleared with the mount cycle,
   * on a resize, and whenever the coordinator's item list changes.
   */
  __scrollDistance: { x: number; y: number } | null = null;

  /**
   * Whether the user asked for reduced motion, kept current by the toolkit's
   * shared `(prefers-reduced-motion: reduce)` service rather than sampled once
   * at mount — the setting is changed mid-session, on every platform that has
   * a "reduce motion" toggle in its quick settings.
   * @private
   */
  __prefersReducedMotion = false;

  /**
   * The sides whose `scroll-padding` this component wrote. Anything the author
   * declared is never touched, and anything written here is recomputed on a
   * resize rather than read back as if it were the author's.
   * @private
   */
  __ownedScrollPadding = new Set<(typeof SIDES)[number]>();

  /**
   * The attributes the tab stop added, so releasing it never strips one the
   * author wrote.
   * @private
   */
  __ownedAttributes = new Set<string>();

  mounted(): MountedReturn {
    const unsubscribe = usePrefersReducedMotion().subscribe(
      ({ matches }) => {
        this.__prefersReducedMotion = matches;
      },
      { immediate: true },
    );

    this.syncScrollPadding();

    return [
      super.mounted(),
      unsubscribe,
      () => {
        this.__scrollDistance = null;
        this.__releaseTabStop();

        for (const side of this.__ownedScrollPadding) {
          this.$el.style.removeProperty(`scroll-padding-${side}`);
        }

        this.__ownedScrollPadding.clear();
      },
    ];
  }

  /**
   * How a programmatic scroll should animate.
   *
   * `smooth` is an author-implemented animation, so it is the carousel's to
   * suppress under `prefers-reduced-motion: reduce`; the destination is
   * unchanged, only the travel disappears.
   */
  get scrollBehavior(): ScrollBehavior {
    return this.__prefersReducedMotion ? 'instant' : 'smooth';
  }

  get scrollDistance(): { x: number; y: number } {
    if (!this.__scrollDistance) {
      const { scrollWidth, clientWidth, scrollHeight, clientHeight } = this.$el;
      // Browsers report fractional scroll sizes, so the last item can settle a
      // sub-pixel short and keep progress from ever reaching a clean `1`.
      this.__scrollDistance = {
        x: Math.round(scrollWidth - clientWidth),
        y: Math.round(scrollHeight - clientHeight),
      };
    }

    return this.__scrollDistance;
  }

  /** Current progress, from `0` to `1`. */
  get progress(): number {
    const { x, y } = this.scrollDistance;

    if (this.isHorizontal) {
      return x === 0 ? 0 : clamp(Math.round(this.$el.scrollLeft) / x, 0, 1);
    }

    return y === 0 ? 0 : clamp(Math.round(this.$el.scrollTop) / y, 0, 1);
  }

  /** Drop the cached distances. Called on resize and when the items change. */
  invalidate(): void {
    this.__scrollDistance = null;
  }

  resized(): void {
    this.invalidate();
    this.syncScrollPadding();
    this.syncAccessibility();
  }

  /** Scroll to the item at the given index, if there is one. */
  scrollToIndex(index: number): void {
    const position = this.carousel?.positions()[index];
    if (position) {
      this.$el.scrollTo({ left: position.left, top: position.top, behavior: this.scrollBehavior });
    }
  }

  /**
   * Mirror the track's own padding into its `scroll-padding`.
   *
   * The scrollport of a scroll container is its **padding** box, so an item
   * scrolled to the start lands flush against the border edge, under whatever
   * the padding was reserving — a mask, a peek, a focus ring's worth of room.
   * That is exactly the case WCAG 2.2 SC 2.4.11 Focus Not Obscured is about,
   * and `scroll-padding` is its sufficient technique: it insets the region the
   * browser scrolls a focused item into.
   *
   * The value is the author's own padding rather than a number this component
   * invents, and a side the author already declared is left alone.
   */
  syncScrollPadding(): void {
    const styles = window.getComputedStyle(this.$el);

    for (const side of SIDES) {
      const isOwned = this.__ownedScrollPadding.has(side);

      // Not ours and already declared: the author decided, leave it.
      if (!isOwned && styles.getPropertyValue(`scroll-padding-${side}`) !== 'auto') {
        continue;
      }

      const padding = styles.getPropertyValue(`padding-${side}`);

      if (Number.parseFloat(padding) > 0) {
        this.$el.style.setProperty(`scroll-padding-${side}`, padding);
        this.__ownedScrollPadding.add(side);
      } else if (isOwned) {
        this.$el.style.removeProperty(`scroll-padding-${side}`);
        this.__ownedScrollPadding.delete(side);
      }
    }
  }

  /**
   * Decide whether the track is a tab stop of its own.
   *
   * A scroll container that a keyboard user cannot reach is a WCAG 2.1.1
   * failure — the content scrolls, and nothing scrolls it. The platform half
   * fixes it and no more: Chrome makes a scroller focusable **only when it has
   * no focusable children**, which a real carousel always has, Firefox makes
   * every scroller a tab stop unconditionally, and Safari has not implemented
   * it at all (WebKit bug #190870, open since 2018). So the tab stop is added
   * here, under Chrome's rule, for every engine.
   *
   * It cannot be decided from the markup. A slide holds arbitrary content, and
   * content arrives after mount — a `Defer`, a `Fetch`, a slide appended by
   * the application — so this is a runtime probe, re-run whenever the slide
   * list changes and on a resize.
   *
   * `tabindex="0"` and never `tabindex="-1"`: a negative `tabindex` on a
   * scrollable region fails the ACT rule outright, because it makes the region
   * scriptable-focusable while still leaving the keyboard with no way in. And
   * a focusable region needs a role and a name, so it takes the carousel's —
   * copied rather than referenced, because the accessible-name algorithm
   * ignores `aria-labelledby` on a node it reached *through* an
   * `aria-labelledby`, and the second hop would fall back to the whole
   * carousel's text.
   */
  syncAccessibility(): void {
    if (hasTabbableDescendant(this.$el)) {
      this.__releaseTabStop();
      return;
    }

    this.__claim('tabindex', '0');
    this.__claim('role', 'group');

    if (!this.$el.hasAttribute('aria-label') && !this.$el.hasAttribute('aria-labelledby')) {
      const root = this.carousel?.el;
      const labelledBy = root?.getAttribute('aria-labelledby');
      const label = root?.getAttribute('aria-label');

      if (labelledBy) {
        this.__claim('aria-labelledby', labelledBy);
      } else if (label) {
        this.__claim('aria-label', label);
      }
    }
  }

  /**
   * Write an attribute the track did not have, and remember it is ours.
   * @private
   */
  __claim(name: string, value: string): void {
    if (this.$el.hasAttribute(name) && !this.__ownedAttributes.has(name)) {
      return;
    }

    this.$el.setAttribute(name, value);
    this.__ownedAttributes.add(name);
  }

  /**
   * Undo the tab stop, and only the parts of it this component wrote.
   * @private
   */
  __releaseTabStop(): void {
    for (const name of this.__ownedAttributes) {
      this.$el.removeAttribute(name);
    }

    this.__ownedAttributes.clear();
  }

  /**
   * Report the scroll-synced index and keep the progress loop running.
   *
   * The loop has to be restarted here because it stops itself once progress
   * settles: without it the `progress` event and `--carousel-progress` would
   * freeze during any scroll `goTo()` did not start, touch scrolling included.
   */
  onScroll(): void {
    const { carousel, isHorizontal, $el } = this;
    if (!carousel) {
      return;
    }

    const positions = carousel.positions();
    const index = getClosestIndex(
      positions.map((position) => (isHorizontal ? position.left : position.top)),
      isHorizontal ? $el.scrollLeft : $el.scrollTop,
    );

    carousel.reportIndex(index);
    carousel.keepTicking();
  }
}
