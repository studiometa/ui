import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { AbstractSliderChild } from './AbstractSliderChild.js';

export interface SliderBtnProps extends BaseProps {
  $options: {
    prev: boolean;
    next: boolean;
  };
}

/**
 * SliderBtn class.
 */
export class SliderBtn<T extends BaseProps = BaseProps> extends AbstractSliderChild<T & SliderBtnProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'SliderBtn',
    options: {
      prev: Boolean,
      next: Boolean,
    },
  };

  /**
   * Update attributes.
   * @param   {number} index
   * @returns {void}
   */
  update(index: number) {
    if (
      (index === 0 && this.$options.prev) ||
      (index === this.$parent.indexMax && this.$options.next)
    ) {
      this.$el.setAttribute('disabled', '');
    } else {
      this.$el.removeAttribute('disabled');
    }
  }

  /**
   * Go prev or next on click.
   * @returns {void}
   */
  onClick() {
    const { prev, next } = this.$options;

    if (prev) {
      this.$parent.goPrev();
    } else if (next) {
      this.$parent.goNext();
    }
  }
}
