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

    carousel.currentIndex = minDiffIndex;
    this.carousel.$services.enable('ticked');
  }

  /**
   * Scroll to the new item on parent carousel go-to event.
   */
  onParentCarouselIndex() {
    const { state } = this.carousel.items[this.carousel.currentIndex];
    if (state) {
      this.$el.scrollTo({ left: state.left, top: state.top, behavior: 'smooth' });
    }
  }
}
