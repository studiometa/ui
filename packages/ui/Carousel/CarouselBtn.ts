import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';

/**
 * Props for the CarouselBtn class.
 */
export interface CarouselBtnProps extends BaseProps {
  $el: HTMLButtonElement;
  $options: {
    action: 'next' | 'prev' | string;
  };
}

/**
 * CarouselBtn class.
 */
export class CarouselBtn<T extends BaseProps = BaseProps> extends AbstractCarouselChild<
  T & CarouselBtnProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'CarouselBtn',
    options: { action: String },
  };

  /**
   * Go to the next or previous item on click.
   */
  onClick() {
    const { carousel } = this;
    if (!carousel) {
      return;
    }

    const { action } = this.$options;
    switch (action) {
      case 'next':
        carousel.goNext();
        break;
      case 'prev':
        carousel.goPrev();
        break;
      default:
        carousel.goTo(Number(action));
        break;
    }
  }

  /**
   * Update the disabled state for the given index.
   */
  update(index: number) {
    const { carousel } = this;
    if (!carousel) {
      return;
    }

    const { action } = this.$options;
    // Base the disabled state on whether the action would actually move the
    // index, so it honours the inherited `Indexable` options: with `boundary`
    // `loop`/`bounce` the ends never disable (navigation wraps), and `reverse`
    // flips which end is terminal. `prevIndex`/`nextIndex` already encode all of
    // that; a numeric action disables only on the slide it points to.
    let shouldDisable: boolean;
    if (action === 'next') {
      shouldDisable = carousel.nextIndex === index;
    } else if (action === 'prev') {
      shouldDisable = carousel.prevIndex === index;
    } else {
      shouldDisable = Number(action) === index;
    }

    this.$el.disabled = shouldDisable;
  }
}
