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
    if (!this.slider) return;

    if (this.$options.contain && !this.slider.$options.contain) {
      this.$warn(
        `The contain option will only works if the parent Slider also has the contain option.`,
      );
    }

    const isContainMaxState =
      this.$options.contain &&
      this.slider.$options.contain &&
      this.slider.containMaxState ===
        this.slider.getStates()[index].x[this.slider.$options.mode];

    if (
      (index === 0 && this.$options.prev) ||
      ((index === this.slider.indexMax || isContainMaxState) && this.$options.next)
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

    if (prev) {
      this.slider?.goPrev();
    } else if (next) {
      this.slider?.goNext();
    }
  }
}
