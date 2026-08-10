import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { withTransition } from '../decorators/index.js';
import { AbstractSliderChild } from './AbstractSliderChild.js';

export interface SliderDotsProps extends BaseProps {
  $refs: {
    dots: HTMLButtonElement[];
  };
}

/**
 * SliderDots class.
 *
 * Pagination dots for the Slider. It reflects the active slide by running the
 * `withTransition` enter/leave classes on the `dots` refs as the index changes,
 * and navigates the parent Slider to the matching slide when a dot is clicked.
 */
export class SliderDots<
  T extends BaseProps = BaseProps,
> extends withTransition<AbstractSliderChild>(AbstractSliderChild)<T & SliderDotsProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'SliderDots',
    refs: ['dots[]'],
  };

  /**
   * Get target.
   */
  get target() {
    return this.$refs.dots;
  }

  /**
   * The current active index.
   */
  currentIndex = -1;

  /**
   * Update dots classes according to the new index.
   */
  update(index: number) {
    if (index !== this.currentIndex) {
      this.leave(this.$refs.dots[this.currentIndex]);
      this.enter(this.$refs.dots[index]);
      this.currentIndex = index;
    }
  }

  /**
   * Go to the given index on dot click.
   */
  onDotsClick({ index }: { index: number }) {
    this.slider?.goTo(index);
  }
}
