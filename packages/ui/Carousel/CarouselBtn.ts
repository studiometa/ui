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
    const { carousel } = this;
    if (!carousel) {
      return;
    }

    const { action } = this.$options;
    switch (action) {
      case 'next':
        carousel.goNext();
        break;
      case 'prev':
        carousel.goPrev();
        break;
      default:
        carousel.goTo(Number(action));
        break;
    }
  }

  /**
   * Update the disabled state for the given index.
   */
  update(index: number) {
    const { carousel } = this;
    if (!carousel) {
      return;
    }

    const { action } = this.$options;
    const { lastIndex } = carousel;
    const shouldDisable =
      (action === 'next' && index === lastIndex) ||
      (action === 'prev' && index === 0) ||
      Number(action) === index;

    this.$el.disabled = shouldDisable;
  }
}
