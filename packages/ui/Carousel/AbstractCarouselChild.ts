import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { Base, getClosestParent } from '@studiometa/js-toolkit';
import { Carousel } from './Carousel.js';

/**
 * AbstractCarouselChild class.
 */
export class AbstractCarouselChild<T extends BaseProps = BaseProps> extends Base<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractCarouselChild',
    emits: ['parent-carousel-go-to', 'parent-carousel-progress'],
  };

  /**
   * Get the parent carousel instance.
   * @todo data-option-carousel for better grouping?
   */
  get carousel() {
    return getClosestParent(this, Carousel);
  }

  /**
   * Is the carousel horizontal?
   */
  get isHorizontal() {
    return this.carousel.isHorizontal;
  }

  /**
   * Is the carousel vertical?
   */
  get isVertical() {
    return this.carousel.isVertical;
  }

  /**
   * Disptach events from the parent carousel on the child components.
   */
  handleEvent(event: CustomEvent) {
    switch (event.type) {
      case 'go-to':
      case 'progress':
        this.$emit(`parent-carousel-${event.type}`, ...event.detail);
        break;
    }
  }

  /**
   * Mounted hook.
   */
  mounted() {
    if (!this.carousel) {
      this.$warn('Could not find a parent slider, not mounting.');
      this.$destroy();
      return;
    }

    this.carousel.$on('go-to', this);
    this.carousel.$on('progress', this);
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    this.carousel?.$off('go-to', this);
    this.carousel?.$off('progress', this);
  }
}
