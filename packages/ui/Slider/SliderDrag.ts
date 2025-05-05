import type { BaseProps, BaseConfig, DragServiceProps } from '@studiometa/js-toolkit';
import { Base, withDrag } from '@studiometa/js-toolkit';

export interface SliderDragProps extends BaseProps {
  $options: {
    scrollLockThreshold: number;
  };
}

/**
 * SliderDrag class.
 */
export class SliderDrag<T extends BaseProps = BaseProps> extends withDrag(Base)<
  T & SliderDragProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'SliderDrag',
    emits: ['start', 'drag', 'drop', 'inertia', 'stop'],
    options: {
      scrollLockThreshold: {
        type: Number,
        default: 10,
      },
    },
  };

  /**
   * Test if the scroll should be blocked. Used with the touchmove event to prevent
   * scrolling vertically when trying to drag the slider.
   */
  get shouldPreventScroll() {
    const { distance } = this.$services.get('dragged') as DragServiceProps;
    return (
      Math.abs(distance.x) > this.$options.scrollLockThreshold &&
      Math.abs(distance.x) > Math.abs(distance.y)
    );
  }

  /**
   * Touchmove handler.
   */
  onTouchmove({ event }: { event: TouchEvent }) {
    if (this.shouldPreventScroll) {
      event.preventDefault();
    }
  }

  /**
   * Emit drag events.
   */
  dragged(props: DragServiceProps) {
    this.$emit(props.mode, props);
  }
}
