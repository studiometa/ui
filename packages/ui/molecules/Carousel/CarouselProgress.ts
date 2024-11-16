import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';

/**
 * Props for the CarouselProgress class.
 */
export interface CarouselProgressProps extends BaseProps {
  $refs: {
    track: HTMLElement;
  };
}

/**
 * CarouselProgress class.
 */
export class CarouselProgress<T extends BaseProps = BaseProps> extends AbstractCarouselChild<
  T & CarouselProgressProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'CarouselProgress',
    refs: ['track'],
  };

  /**
   * Update track style on parent carousel progress.
   */
  onParentCarouselProgress() {
    this.$refs.track.style.setProperty('--tw-translate-x', (this.slider.progress - 1) * 100 + '%');
  }
}
