import type { BaseConfig } from '@studiometa/js-toolkit';
import type { IndexableInstructions, IndexableProps } from '../decorators/index.js';
import { Indexable } from '../Indexable/index.js';
import { CarouselBtn } from './CarouselBtn.js';
import { CarouselDrag } from './CarouselDrag.js';
import { CarouselItem } from './CarouselItem.js';
import { CarouselWrapper } from './CarouselWrapper.js';

/**
 * Props for the Carousel class.
 */
export interface CarouselProps {
  $children: {
    CarouselBtn: CarouselBtn[];
    CarouselDrag: CarouselDrag[];
    CarouselItem: CarouselItem[];
    CarouselWrapper: CarouselWrapper[];
  };
  $options: {
    axis: 'x' | 'y';
  };
}

/**
 * Carousel class.
 */
export class Carousel<T extends IndexableProps = IndexableProps> extends Indexable<T & CarouselProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Carousel',
    components: {
      CarouselBtn,
      CarouselDrag,
      CarouselItem,
      CarouselWrapper,
    },
    options: {
      ...Indexable.config.options,
      axis: { type: String, default: 'x' },
    },
    emits: ['progress'],
  };

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
   * Get the carousel's length.
   */
  get length() {
    return this.items?.length || 0;
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
    this.goTo(this.currentIndex);
  }

  /**
   * Resized hook.
   */
  resized() {
    this.goTo(this.currentIndex);
  }

  /**
   * Go to the given item.
   */
  goTo(indexOrInstruction: number | IndexableInstructions) {
    this.$log('goTo', indexOrInstruction);
    this.$services.enable('ticked');
    return super.goTo(indexOrInstruction);
  }

  ticked() {
    if (this.progress !== this.previousProgress) {
      this.previousProgress = this.progress;
      this.$emit('progress', this.progress);
      this.$el.style.setProperty('--carousel-progress', String(this.progress));
    } else {
      this.$services.disable('ticked');
    }
  }
}
