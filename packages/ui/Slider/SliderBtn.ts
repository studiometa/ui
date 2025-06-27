import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { AbstractSliderChild } from './AbstractSliderChild.js';

export interface SliderBtnProps extends BaseProps {
  $options: {
    prev: boolean;
    next: boolean;
    index: number;
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
      index: {
        type: Number,
        default: -1,
      },
      contain: Boolean,
    },
  };

  /**
   * Update attributes.
   */
  update(index: number) {
    const { contain, prev, next } = this.$options;
    const { $parent } = this;

    if (this.$options.contain && !this.$parent.$options.contain) {
      this.$warn(
        `The contain option will only works if the parent Slider also has the contain option.`,
      );
    }

    const isContainMaxState =
      contain &&
      $parent.$options.contain &&
      $parent.containMaxState === $parent.getStateValueByMode($parent.currentState.x);

    if ((prev && index === 0) || (next && (index === $parent.indexMax || isContainMaxState))) {
      this.$el.setAttribute('disabled', '');
    } else {
      this.$el.removeAttribute('disabled');
    }
  }

  /**
   * Go prev or next on click.
   */
  onClick() {
    const { prev, next, index } = this.$options;

    if (prev) {
      this.$parent.goPrev();
    } else if (next) {
      this.$parent.goNext();
    } else if (index >= 0) {
      this.$parent.goTo(index);
    }
  }
}
