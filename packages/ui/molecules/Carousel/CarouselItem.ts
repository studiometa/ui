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
    return this.slider.$children.CarouselItem.indexOf(this);
  }

  /**
   * The item's active state descriptor.
   */
  get state(): ScrollAction {
    const [state] = compute(this.$el, {
      block: 'nearest',
      inline: 'center',
      boundary: this.slider.wrapper.$el,
    });
    return state;
  }

  /**
   * Update the item's state on parent carousel progress.
   */
  onParentCarouselProgress() {
    const isActive = this.index === this.slider.index;
    this.$el.classList.toggle('ring', isActive);
  }

  /**
   * Go to the item's index on click.
   */
  onClick() {
    this.slider.goTo(this.index);
  }
}
