import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';

/**
 * Props for the CarouselDots class.
 */
export interface CarouselDotsProps extends BaseProps {
  $refs: {
    dots: HTMLButtonElement[];
  };
}

/**
 * CarouselDots class.
 */
export class CarouselDots<T extends BaseProps = BaseProps> extends AbstractCarouselChild<
  T & CarouselDotsProps
> {
  /**
   * Config.
   * @type {BaseConfig}
   */
  static config: BaseConfig = {
    name: 'CarouselDots',
    refs: ['dots[]'],
  };

  /**
   * Go to matching index on dot click.
   */
  onDotsClick({ index }) {
    this.slider.goTo(index);
  }

  /**
   * Update dots on parent slider progress.
   */
  onParentCarouselProgress() {
    const { index } = this.slider;

    this.$refs.dots.forEach((dot, i) => {
      dot.disabled = index === i;
      dot.classList.toggle('ring-opacity-25', index !== i);
    });
  }
}
