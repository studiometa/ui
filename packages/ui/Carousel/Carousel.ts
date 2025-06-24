import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { CarouselBtn } from './CarouselBtn.js';
import { CarouselDrag } from './CarouselDrag.js';
import { CarouselItem } from './CarouselItem.js';
import { CarouselProgress } from './CarouselProgress.js';
import { CarouselWrapper } from './CarouselWrapper.js';

/**
 * Props for the Carousel class.
 */
export interface CarouselProps {
  $children: {
    CarouselBtn: CarouselBtn[];
    CarouselDrag: CarouselDrag[];
    CarouselItem: CarouselItem[];
    CarouselProgress: CarouselProgress[];
    CarouselWrapper: CarouselWrapper[];
  };
  $options: {
    axis: 'x' | 'y';
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
    name: 'Carousel',
    components: {
      CarouselBtn,
      CarouselDrag,
      CarouselItem,
      CarouselProgress,
      CarouselWrapper,
    },
    options: {
      axis: { type: String, default: 'x' },
    },
    emits: ['go-to', 'progress'],
  };

  /**
   * Carousel index.
   */
  __index = 0;

  /**
   * Get current index.
   */
  get index() {
    return this.__index;
  }

  /**
   * Set current index.
   */
  set index(value) {
    this.__index = value;
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
   * Is the carousel horizontal?
   */
  get isHorizontal() {
    return !this.isVertical;
  }

  /**
   * Is the carousel vertical?
   */
  get isVertical() {
    return this.$options.axis === 'y';
  }

  /**
   * Get the carousel's items.
   */
  get items() {
    return this.$children.CarouselItem;
  }

  /**
   * Get the carousel's wrapper.
   */
  get wrapper() {
    return this.$children.CarouselWrapper?.[0];
  }

  /**
   * Previous progress value.
   */
  previousProgress = -1;

  /**
   * Progress from 0 to 1.
   */
  get progress() {
    return this.wrapper?.progress ?? 0;
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
  goTo(index: number) {
    this.$log('goTo', index);
    this.index = index;
    this.$emit('go-to', index);
  }

  ticked() {
    if (this.progress != this.previousProgress) {
      this.previousProgress = this.progress;
      this.$emit('progress', this.progress);
    } else {
      this.$services.disable('ticked');
    }
  }
}
