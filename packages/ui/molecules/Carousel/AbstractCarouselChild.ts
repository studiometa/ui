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
   */
  get slider() {
    // @todo data-option-carousel for better grouping?
    return getClosestParent(this, Carousel);
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
    if (!this.slider) {
      throw new Error('Could not find a parent slider.');
    }

    this.slider.$on('go-to', this);
    this.slider.$on('progress', this);
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    this.slider?.$off('go-to', this);
    this.slider?.$off('progress', this);
  }
}
