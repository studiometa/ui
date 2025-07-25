import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';

/**
 * Props for the CarouselBtn class.
 */
export interface CarouselBtnProps extends BaseProps {
  $el: HTMLButtonElement;
  $options: {
    action: 'next' | 'prev' | string;
  };
}

/**
 * CarouselBtn class.
 */
export class CarouselBtn<T extends BaseProps = BaseProps> extends AbstractCarouselChild<
  T & CarouselBtnProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'CarouselBtn',
    options: { action: String },
  };

  /**
   * Go to the next or previous item on click.
   */
  onClick() {
    const { action } = this.$options;
    switch (action) {
      case 'next':
        this.carousel.goNext();
        break;
      case 'prev':
        this.carousel.goPrev();
        break;
      default:
        this.carousel.goTo(Number(action));
        break;
    }
  }

  /**
   * Update button state on parent carousel progress.
   */
  onParentCarouselProgress() {
    const { action } = this.$options;
    const { currentIndex, lastIndex } = this.carousel;
    const shouldDisable =
      (action === 'next' && currentIndex === lastIndex) ||
      (action === 'prev' && currentIndex === 0) ||
      Number(action) === currentIndex;

    this.$el.disabled = shouldDisable;
  }
}
