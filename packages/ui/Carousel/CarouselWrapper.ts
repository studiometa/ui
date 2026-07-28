import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { clamp } from '@studiometa/js-toolkit/utils';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';
import { getClosestIndex } from './utils.js';

/**
 * Props for the CarouselWrapper class.
 */
export interface CarouselWrapperProps extends BaseProps {}

/**
 * CarouselWrapper class.
 */
export class CarouselWrapper<T extends BaseProps = BaseProps> extends AbstractCarouselChild<
  T & CarouselWrapperProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'CarouselWrapper',
  };

  /**
   * Whether the current index is being synced from a scroll event. While this
   * is `true`, the wrapper must not scroll back to the index, otherwise the
   * scroll position and the index fight each other and hijack any smooth
   * scroll triggered by `goTo()`.
   * @private
   */
  __syncingIndexFromScroll = false;

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
   * Update index and emit progress on wrapper scroll.
   */
  onScroll() {
    const { isHorizontal, $el, carousel } = this;

    const minDiffIndex = getClosestIndex(
      carousel.items.map((item) => (isHorizontal ? item.state.left : item.state.top)),
      isHorizontal ? $el.scrollLeft : $el.scrollTop,
    );

    // Reflect the scroll position on the index without scrolling back to it:
    // the `index` event is dispatched synchronously, so `onParentCarouselIndex`
    // runs while this flag is set and bails out.
    this.__syncingIndexFromScroll = true;
    carousel.currentIndex = minDiffIndex;
    this.__syncingIndexFromScroll = false;

    this.carousel.$services.enable('ticked');
  }

  /**
   * Scroll to the new item on parent carousel go-to event.
   */
  onParentCarouselIndex() {
    if (this.__syncingIndexFromScroll) {
      return;
    }

    const { state } = this.carousel.items[this.carousel.currentIndex];
    if (state) {
      this.$el.scrollTo({ left: state.left, top: state.top, behavior: 'smooth' });
    }
  }
}
