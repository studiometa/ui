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
      return scrollLeft / (scrollWidth - offsetWidth);
    } else if (this.isVertical) {
      const { scrollTop, scrollHeight, offsetHeight } = this.$el;
      return scrollTop / (scrollHeight - offsetHeight);
    }

    return 0;
  }

  /**
   * Set the carousel index based on the wrapper scroll position.
   */
  setIndexFromScrollPosition(scroll) {
    const { isHorizontal } = this;

    const minDiffIndex = getClosestIndex(
      this.carousel.items.map((item) => (isHorizontal ? item.state.left : item.state.top)),
      scroll,
    );
    this.carousel.index = minDiffIndex;
  }

  /**
   * Scroll to the given position.
   */
  scrollTo(options: ScrollToOptions) {
    this.$el.scrollTo(options);
  }

  /**
   * Update index and emit progress on wrapper scroll.
   */
  onScroll() {
    this.setIndexFromScrollPosition(
      Math.round(this.isHorizontal ? this.$el.scrollLeft : this.$el.scrollTop),
    );
    this.carousel.$emit('progress', this.progress);
  }

  /**
   * Scroll to the new item on parent carousel go-to event.
   */
  onParentCarouselGoTo() {
    const { state } = this.carousel.items[this.carousel.index] ?? {};
    if (state) {
      this.scrollTo({ left: state.left, top: state.top, behavior: 'smooth' });
    }
  }
}
