import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { ScrollAction } from 'compute-scroll-into-view';
import { domScheduler } from '@studiometa/js-toolkit/utils';
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

  __state: ScrollAction;
  __shouldEvaluateState = true;

  /**
   * The item's active state descriptor.
   */
  get state(): ScrollAction {
    if (this.__shouldEvaluateState) {
      const [state] = compute(this.$el, {
        block: 'center',
        inline: 'center',
        boundary: this.carousel.wrapper.$el,
      });
      this.__state = state;
      this.__shouldEvaluateState = false;
    }

    return this.__state;
  }

  resized() {
    this.__shouldEvaluateState = true;
  }

  /**
   * Update the item's state on parent carousel progress.
   * @todo a11y
   */
  onParentCarouselProgress() {
    domScheduler.read(() => {
      const { index } = this;
      const { index: carouselIndex } = this.carousel;

      domScheduler.write(() => {
        this.$el.style.setProperty(
          '--carousel-item-active',
          String(Number(index === carouselIndex)),
        );
      });
    });
  }
}
