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
 *
 * A progress indicator for the Slider. It translates its `progress` ref along
 * the x axis in proportion to the active index over the slider's total range,
 * revealing more of the bar as the slider advances.
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
    const { slider } = this;
    if (!slider) {
      return;
    }

    domScheduler.read(() => {
      const { progress } = this.$refs;
      const x = map(index, 0, slider.indexMax, progress.clientWidth * -1, 0);
      domScheduler.write(() => {
        transform(progress, { x });
      });
    });
  }
}
