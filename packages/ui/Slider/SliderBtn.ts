import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { AbstractSliderChild } from './AbstractSliderChild.js';

export interface SliderBtnProps extends BaseProps {
  $options: {
    prev: boolean;
    next: boolean;
    contain: boolean;
  };
}

/**
 * SliderBtn class.
 */
export class SliderBtn<T extends BaseProps = BaseProps> extends AbstractSliderChild<
  T & SliderBtnProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'SliderBtn',
    options: {
      prev: Boolean,
      next: Boolean,
      contain: Boolean,
    },
  };

  /**
   * Update attributes.
   */
  update(index: number) {
    const { slider } = this;
    if (!slider) {
      return;
    }

    if (this.$options.contain && !slider.$options.contain) {
      this.$warn(
        `The contain option will only works if the parent Slider also has the contain option.`,
      );
    }

    const isContainMaxState =
      this.$options.contain &&
      slider.$options.contain &&
      slider.containMaxState === slider.getStates()[index].x[slider.$options.mode];

    if (
      (index === 0 && this.$options.prev) ||
      ((index === slider.indexMax || isContainMaxState) && this.$options.next)
    ) {
      this.$el.setAttribute('disabled', '');
    } else {
      this.$el.removeAttribute('disabled');
    }
  }

  /**
   * Go prev or next on click.
   */
  onClick() {
    const { prev, next } = this.$options;
    const { slider } = this;
    if (!slider) {
      return;
    }

    if (prev) {
      slider.goPrev();
    } else if (next) {
      slider.goNext();
    }
  }
}
