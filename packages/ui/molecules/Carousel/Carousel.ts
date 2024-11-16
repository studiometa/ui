import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { CarouselItem } from './CarouselItem.js';
import { CarouselWrapper } from './CarouselWrapper.js';

/**
 * Props for the Carousel class.
 */
export interface CarouselProps {
  $children: {
    CarouselItem: CarouselItem[];
    CarouselWrapper: CarouselWrapper[];
  };
}

/**
 * Carousel class.
 */
export class Carousel<T extends BaseProps = BaseProps> extends Base<T & CarouselProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Slider',
    components: {
      CarouselItem,
      CarouselWrapper,
    },
    emits: ['go-to', 'progress'],
  };

  /**
   * Carousel index.
   */
  index = 0;

  /**
   * Get the carousel's wrapper.
   */
  get wrapper() {
    return this.$children.CarouselWrapper[0];
  }

  /**
   * Get the carousel's items.
   */
  get items() {
    return this.$children.CarouselItem;
  }

  /**
   * Previous index.
   */
  get prevIndex() {
    return Math.max(this.index - 1, 0);
  }

  /**
   * Next index.
   */
  get nextIndex() {
    return Math.min(this.index + 1, this.lastIndex);
  }

  /**
   * Last index.
   */
  get lastIndex() {
    return this.items.length - 1;
  }

  /**
   * Progress from 0 to 1.
   */
  get progress() {
    return this.wrapper.progress;
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.goTo(this.index);
  }

  /**
   * Resized hook.
   */
  resized() {
    this.goTo(this.index);
  }

  /**
   * Go to the previous item.
   */
  goPrev() {
    this.goTo(this.prevIndex);
  }

  /**
   * Go to the next item.
   */
  goNext() {
    this.goTo(this.nextIndex);
  }

  /**
   * Go to the given item.
   */
  goTo(index) {
    console.log('goTo', index);
    this.index = index;
    this.$emit('go-to', index);
    this.$emit('progress', this.progress);
  }
}
