import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { transform, map, domScheduler } from '@studiometa/js-toolkit/utils';
import { AbstractSliderChild } from './AbstractSliderChild.js';

export interface SliderProgressProps extends BaseProps {
  $refs: {
    progress: HTMLElement;
  };
}

/**
 * SliderProgress class.
 */
export class SliderProgress<T extends BaseProps = BaseProps> extends AbstractSliderChild<
  T & SliderProgressProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'SliderProgress',
    refs: ['progress'],
  };

  /**
   * Update the progress indicator.
   */
  update(index: number) {
    domScheduler.read(() => {
      const { progress } = this.$refs;
      const x = map(index, 0, this.$parent.indexMax, progress.clientWidth * -1, 0);
      domScheduler.write(() => {
        transform(progress, { x });
      });
    });
  }
}
