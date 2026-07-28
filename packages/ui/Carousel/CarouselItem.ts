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
    return this.carousel?.$children.CarouselItem.indexOf(this) ?? -1;
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
        boundary: this.carousel?.wrapper?.$el,
      });
      this.__state = state;
      this.__shouldEvaluateState = false;
    }

    return this.__state;
  }

  /**
   * Invalidate the cached state on resize.
   *
   * Extends the base reconnect/refresh (`super.resized`) rather than shadowing
   * it: the cache is invalidated first so a subsequent `state` read re-measures.
   * The active-state `update` does not depend on geometry, so the ordering only
   * matters for keeping the base refresh alive for a future edit.
   */
  resized() {
    this.__shouldEvaluateState = true;
    super.resized();
  }

  /**
   * Invalidate the cached scroll target when the item list or content changes.
   *
   * Inserting/removing slides (or changing an item's content) via `$update`
   * shifts the offsets returned by `compute-scroll-into-view`, so the cache is
   * cleared before the base reconnect/refresh runs — otherwise `scrollToIndex`
   * and `onScroll` keep using stale positions until the next resize.
   */
  updated() {
    this.__shouldEvaluateState = true;
    super.updated();
  }

  /**
   * Reflect the active state for the given index.
   * @todo a11y
   */
  update(index: number) {
    const isActive = this.index === index;
    return () => {
      this.$el.style.setProperty('--carousel-item-active', String(Number(isActive)));
    };
  }
}
