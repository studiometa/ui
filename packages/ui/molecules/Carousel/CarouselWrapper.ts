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
    const { scrollLeft, scrollWidth, offsetWidth } = this.$el;
    return scrollLeft / (scrollWidth - offsetWidth);
  }

  /**
   * Set the carousel index based on the wrapper scroll position.
   */
  setIndexFromScrollPosition() {
    const scroll = Math.round(this.$el.scrollLeft);
    const minDiffIndex = getClosestIndex(
      this.slider.items.map((item) => item.state.left),
      scroll,
    );
    this.slider.index = minDiffIndex;
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
    this.setIndexFromScrollPosition();
    this.slider.$emit('progress', this.progress);
  }


  /**
   * Scroll to the new item on parent carousel go-to event.
   */
  onParentCarouselGoTo() {
    const { state } = this.slider.items[this.slider.index];
    this.scrollTo({ left: state.left, behavior: 'smooth' });
  }
}
