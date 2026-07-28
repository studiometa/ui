import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
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
   * Current progress between 0 and 1.
   */
  get progress() {
    if (this.isHorizontal) {
      const { scrollLeft, scrollWidth, offsetWidth } = this.$el;
      return scrollWidth - offsetWidth === 0 ? 0 : scrollLeft / (scrollWidth - offsetWidth);
    } else if (this.isVertical) {
      const { scrollTop, scrollHeight, offsetHeight } = this.$el;
      return scrollHeight - offsetHeight === 0 ? 0 : scrollTop / (scrollHeight - offsetHeight);
    }

    return 0;
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
