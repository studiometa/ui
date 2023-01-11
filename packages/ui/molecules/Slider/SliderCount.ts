import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { AbstractSliderChild } from './AbstractSliderChild.js';

export interface SliderCountProps extends BaseProps {
  $refs: {
    current: HTMLElement;
  };
}

/**
 * SliderCount class.
 */
export class SliderCount<T extends BaseProps = BaseProps> extends AbstractSliderChild<
  T & SliderCountProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'SliderCount',
    refs: ['current'],
  };

  /**
   * Update the current counter indicator.
   *
   * @param   {number} index The new active index.
   * @returns {void}
   */
  update(index: number) {
    this.$refs.current.innerHTML = `${index + 1}`;
  }
}
