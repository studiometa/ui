import type { BaseConfig, BaseProps, DragServiceProps } from '@studiometa/js-toolkit';
import { withDrag, withMountOnMediaQuery } from '@studiometa/js-toolkit';
import { inertiaFinalValue } from '@studiometa/js-toolkit/utils';
import { AbstractCarouselComponent } from './AbstractCarouselComponent.js';
import { getClosestIndex } from './utils.js';

/**
 * Props for the CarouselDrag class.
 */
export interface CarouselDragProps extends BaseProps {}

/**
 * CarouselDrag class.
 *
 * The draggable track of the Carousel. It only reads the carousel (items and
 * orientation) and never reacts to index changes, so it extends the
 * non-subscribing `AbstractCarouselComponent` rather than
 * `AbstractCarouselChild` — mirroring how `SliderDrag` extends `Base`, not
 * `AbstractSliderChild`.
 */
export class CarouselDrag<
  T extends BaseProps = BaseProps,
> extends withMountOnMediaQuery<AbstractCarouselComponent>(
  withDrag(AbstractCarouselComponent),
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
      const { carousel } = this;
      if (!carousel) {
        return;
      }

      const options: ScrollToOptions = { behavior: 'smooth' };

      if (this.isHorizontal) {
        const finalValue = inertiaFinalValue(wrapper.scrollLeft, props.delta.x * -2.5);
        const index = getClosestIndex(
          carousel.items.map((item) => item.state.left),
          finalValue,
        );
        options.left = carousel.items[index]?.state?.left;
      } else if (this.isVertical) {
        const finalValue = inertiaFinalValue(wrapper.scrollTop, props.delta.y * -2.5);
        const index = getClosestIndex(
          carousel.items.map((item) => item.state.top),
          finalValue,
        );
        options.top = carousel.items[index]?.state?.top;
      }

      // No target slide to snap to (e.g. an empty carousel): restore scroll-snap
      // — which the `drag` branch disabled — and bail instead of scrolling to an
      // `undefined` offset.
      if (options.left === undefined && options.top === undefined) {
        wrapper.style.scrollSnapType = '';
        return;
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
