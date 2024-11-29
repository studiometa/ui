import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';

/**
 * Props for the CarouselBtn class.
 */
export interface CarouselBtnProps extends BaseProps {
  $el: HTMLButtonElement;
  $options: {
    direction: 'next' | 'prev';
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
    options: { direction: String },
  };

  /**
   * Go to the next or previous item on click.
   */
  onClick() {
    switch (this.$options.direction) {
      case 'next':
        this.slider.goNext();
        break;
      case 'prev':
        this.slider.goPrev();
        break;
    }
  }

  /**
   * Update button state on parent carousel progress.
   */
  onParentCarouselProgress() {
    const { direction } = this.$options;
    const { index, lastIndex } = this.slider;
    const shouldDisable =
      (direction === 'next' && index === lastIndex) || (direction === 'prev' && index === 0);

    this.$el.disabled = shouldDisable;
  }
}
