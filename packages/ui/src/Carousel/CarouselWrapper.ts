import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { clamp } from '@studiometa/js-toolkit/utils/clamp';
import { AbstractCarouselComponent } from './AbstractCarouselComponent.js';
import { getClosestIndex } from './utils.js';

/**
 * Props for the CarouselWrapper class.
 */
export interface CarouselWrapperProps extends BaseProps {}

/**
 * CarouselWrapper class.
 *
 * The scrollable track of the Carousel. It scrolls to a given item on demand
 * through the imperative `scrollToIndex` (called by `Carousel.goTo`) and, on
 * native/touch scroll, merely reports the closest item back to the Carousel via
 * `currentIndex`. Because scrolling is only ever initiated by `goTo` and
 * `onScroll` only reports, the scroll/index feedback loop that used to hijack a
 * smooth scroll cannot form, so no synchronising guard is needed.
 */
export class CarouselWrapper<T extends BaseProps = BaseProps> extends AbstractCarouselComponent<
  T & CarouselWrapperProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'CarouselWrapper',
  };

  /**
   * Cached maximum scroll distances (`scrollWidth - clientWidth` and
   * `scrollHeight - clientHeight`). The `progress` getter runs on every frame,
   * so these layout-triggering reads are cached and only refreshed on resize.
   * @private
   */
  __scrollDistance = { x: 0, y: 0 };

  /**
   * Whether the cached scroll distances need to be re-measured.
   * @private
   */
  __shouldMeasure = true;

  /**
   * Current progress between 0 and 1.
   */
  get progress() {
    if (this.__shouldMeasure) {
      const { scrollWidth, clientWidth, scrollHeight, clientHeight } = this.$el;
      // Round to integer pixels: browsers report fractional scroll sizes and
      // offsets, so the last item can settle a sub-pixel short of the maximum
      // and keep progress from ever reaching a clean `1`.
      this.__scrollDistance = {
        x: Math.round(scrollWidth - clientWidth),
        y: Math.round(scrollHeight - clientHeight),
      };
      this.__shouldMeasure = false;
    }

    if (this.isHorizontal) {
      const { x } = this.__scrollDistance;
      return x === 0 ? 0 : clamp(Math.round(this.$el.scrollLeft) / x, 0, 1);
    } else if (this.isVertical) {
      const { y } = this.__scrollDistance;
      return y === 0 ? 0 : clamp(Math.round(this.$el.scrollTop) / y, 0, 1);
    }

    return 0;
  }

  /**
   * Invalidate the cached scroll distances on resize.
   */
  resized() {
    this.__shouldMeasure = true;
  }

  /**
   * Invalidate the cached scroll distances when the item list changes.
   *
   * Adding or removing items changes `scrollWidth`, so `progress` (and the
   * `--carousel-progress` variable derived from it) would keep dividing by the
   * pre-update distance until the next resize otherwise.
   */
  updated() {
    this.__shouldMeasure = true;
  }

  /**
   * Scroll to the item at the given index.
   *
   * Called imperatively by `Carousel.goTo`. Guards against an empty carousel or
   * a missing item so the unconditional mount-time seed cannot throw.
   */
  scrollToIndex(index: number) {
    const state = this.carousel?.items[index]?.state;
    if (state) {
      this.$el.scrollTo({ left: state.left, top: state.top, behavior: 'smooth' });
    }
  }

  /**
   * Report the scroll-synced index and keep the progress bar animating.
   *
   * Assigning `carousel.currentIndex` only stores/reports the index — it never
   * scrolls back — so this cannot hijack a `goTo` smooth scroll. The `ticked`
   * service must be (re-)enabled here because it self-disables once progress
   * stabilises: without it `--carousel-progress` and the `progress` event would
   * freeze during any scroll not initiated by `goTo`, including all touch
   * scrolling (the `CarouselDrag` track only mounts on `(pointer: fine)`).
   */
  onScroll() {
    const { isHorizontal, $el, carousel } = this;
    if (!carousel) {
      return;
    }

    const minDiffIndex = getClosestIndex(
      carousel.items.map((item) => (isHorizontal ? item.state.left : item.state.top)),
      isHorizontal ? $el.scrollLeft : $el.scrollTop,
    );

    carousel.currentIndex = minDiffIndex;
    carousel.$services.enable('ticked');
  }
}
