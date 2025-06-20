import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { ScrollAction } from 'compute-scroll-into-view';
import { compute } from 'compute-scroll-into-view';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';

/**
 * Props for the CarouselItem class.
 */
export interface CarouselItemProps extends BaseProps {}

/**
 * CarouselItem class.
 */
export class CarouselItem<T extends BaseProps = BaseProps> extends AbstractCarouselChild<
  T & CarouselItemProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'CarouselItem',
  };

  /**
   * The item's index in the carousel.
   */
  get index() {
    return this.carousel.$children.CarouselItem.indexOf(this);
  }

  /**
   * The item's active state descriptor.
   */
  get state(): ScrollAction {
    const [state] = compute(this.$el, {
      block: 'center',
      inline: 'center',
      boundary: this.carousel.wrapper.$el,
    });
    return state;
  }

  timer: number;

  /**
   * Update the item's state on parent carousel progress.
   * @todo a11y
   */
  onParentCarouselProgress() {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.$el.style.setProperty(
        '--carousel-item-active',
        String(Number(this.index === this.carousel.index)),
      );
    }, 16);
  }
}
