import type { BaseConfig, BaseProps, DragServiceProps } from '@studiometa/js-toolkit';
import { withDrag } from '@studiometa/js-toolkit';
import { inertiaFinalValue, tween, lerp } from '@studiometa/js-toolkit/utils';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';
import { getClosestIndex } from './utils.js';

/**
 * Props for the CarouselDrag class.
 */
export interface CarouselDragProps extends BaseProps {}

/**
 * CarouselDrag class.
 */
export class CarouselDrag<T> extends withDrag<AbstractCarouselChild>(AbstractCarouselChild)<
  T & CarouselDragProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'CarouselDrag',
  };

  /**
   * Tween instance for inertia on drop.
   */
  tween: ReturnType<typeof tween>;

  /**
   * Dragged hook.
   */
  dragged(props: DragServiceProps) {
    const wrapper = this.$el;

    // do nothing if scroll-snap is enabled as it is better than this drag implementation
    if (getComputedStyle(wrapper).scrollSnapType !== 'none') {
      return;
    }

    // do noting on inertia and stop
    if (props.mode === 'inertia' || props.mode === 'stop') {
      return;
    }

    // do nothing while the distance is 0
    if (props.distance.x === 0) {
      return;
    }

    if (this.tween) {
      this.tween.pause();
    }

    if (props.mode === 'drag') {
      const left = wrapper.scrollLeft - props.delta.x;
      wrapper.scrollTo({ left, behavior: 'instant' });
    }

    if (props.mode === 'drop') {
      const start = wrapper.scrollLeft;
      const finalValue = inertiaFinalValue(wrapper.scrollLeft, props.delta.x * -2.5);
      const index = getClosestIndex(
        this.slider.items.map((item) => item.state.left),
        finalValue,
      );
      const target = this.slider.items[index].state.left;

      this.tween = tween(
        (progress) => {
          const left = lerp(start, target, progress);
          this.slider.wrapper.scrollTo({ left, behavior: 'instant' });
        },
        {
          onFinish: () => {
            this.slider.goTo(index);
          },
          smooth: 0.25,
        },
      );
      this.tween.start();
    }
  }
}
