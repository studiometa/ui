import type { BaseConfig, BaseProps, DragServiceProps } from '@studiometa/js-toolkit';
import { withDrag, withMountOnMediaQuery } from '@studiometa/js-toolkit';
import { inertiaFinalValue } from '@studiometa/js-toolkit/utils';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';
import { getClosestIndex } from './utils.js';

/**
 * Props for the CarouselDrag class.
 */
export interface CarouselDragProps extends BaseProps {}

/**
 * CarouselDrag class.
 */
export class CarouselDrag<
  T extends BaseProps = BaseProps,
> extends withMountOnMediaQuery<AbstractCarouselChild>(
  withDrag(AbstractCarouselChild),
  '(pointer: fine)',
)<T & CarouselDragProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'CarouselDrag',
  };

  /**
   * Dragged hook.
   */
  dragged(props: DragServiceProps) {
    if (!this.$isMounted) return;

    // do noting on inertia and stop
    if (props.mode === 'inertia' || props.mode === 'stop') {
      return;
    }

    // do nothin while the distance is 0
    if (
      (this.isHorizontal && props.distance.x === 0) ||
      (this.isVertical && props.distance.y === 0)
    ) {
      return;
    }

    const wrapper = this.$el;

    // @todo wait for the props.delta values to be fixed
    // @see https://github.com/studiometa/js-toolkit/pull/533
    if (props.mode === 'drag') {
      const left = wrapper.scrollLeft - props.delta.x;
      const top = wrapper.scrollTop - props.delta.y;
      // We must disable the scroll-snap otherwise we
      // cannot programmatically scroll to a position
      // that is not a snap-point. This might be easily
      // fixed by not using scroll-snap at all.
      wrapper.style.scrollSnapType = 'none';
      wrapper.scrollTo({ left, top, behavior: 'instant' });
      return;
    }

    // @todo implement inertia with the raf service for a smoother transition than the native smooth scroll
    if (props.mode === 'drop') {
      const options: ScrollToOptions = { behavior: 'smooth' };

      if (this.isHorizontal) {
        const finalValue = inertiaFinalValue(wrapper.scrollLeft, props.delta.x * -2.5);
        const index = getClosestIndex(
          this.carousel.items.map((item) => item.state.left),
          finalValue,
        );
        options.left = this.carousel.items[index].state.left;
      } else if (this.isVertical) {
        const finalValue = inertiaFinalValue(wrapper.scrollTop, props.delta.y * -2.5);
        const index = getClosestIndex(
          this.carousel.items.map((item) => item.state.top),
          finalValue,
        );
        options.top = this.carousel.items[index].state.top;
      }

      wrapper.addEventListener(
        'scrollend',
        () => {
          wrapper.style.scrollSnapType = '';
        },
        { once: true },
      );
      wrapper.scrollTo(options);
    }
  }
}
