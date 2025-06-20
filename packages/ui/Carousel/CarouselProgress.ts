import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';

/**
 * Props for the CarouselProgress class.
 */
export interface CarouselProgressProps extends BaseProps {}

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
  };

  /**
   * Update track style on parent carousel progress.
   */
  onParentCarouselProgress() {
    this.$el.style.setProperty('--carousel-progress', String(this.carousel.progress));
  }
}
