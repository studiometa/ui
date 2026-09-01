import { Base, withRaf, withScroll } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps, RafProps, ScrollProps } from '@studiometa/js-toolkit';
import { damp, transform } from '@studiometa/js-toolkit/utils';

export interface CircularMarqueeProps extends BaseProps {
  $options: {
    sensitivity: number;
  };
}

/**
 * CircularMarquee class.
 *
 * Continuously rotates its element in response to scrolling, turning page scroll
 * into a spinning marquee. Each scroll event feeds the vertical delta into a
 * rotation accumulated on every animation frame, damped for smoothness and scaled
 * by the `sensitivity` option (`data-option-sensitivity`, default `0.1`), then
 * applied through a CSS transform.
 *
 * @link https://ui.studiometa.dev/reference/items/CircularMarquee/
 */
export class CircularMarquee extends withScroll(withRaf(Base))<CircularMarqueeProps> {
  /**
   * CircularMarquee Configuration
   */
  static config: BaseConfig = {
    name: 'CircularMarquee',
    options: {
      sensitivity: {
        type: Number,
        default: 0.1,
      },
    },
  };

  /**
   * Rotate value.
   * @type {number}
   */
  rotate = 0;

  /**
   * Scroll delta Y.
   * @type {number}
   */
  deltaY = 0;

  /**
   * Transform values.
   * @type {object}
   */
  transform = {
    rotate: 0,
  };

  /** Feed the vertical scroll delta into the rotation speed. */
  scrolled(props: ScrollProps) {
    this.deltaY = props.deltaY;
  }

  /**
   * Advance and damp the rotation, then write it in the frame's write phase.
   *
   * `damp()` takes the frame's elapsed time in v4, which is what makes the
   * easing frame-rate independent: the same gesture settles over the same
   * duration whether the page runs at 60 or 120 frames per second.
   */
  ticked({ delta }: RafProps) {
    this.rotate -= (Math.abs(this.deltaY) + 1) * this.$options.sensitivity;

    this.transform.rotate = damp(this.rotate, this.transform.rotate, 0.25, delta);

    return () => {
      this.$el.style.transform = transform(this.transform);
    };
  }
}

export default CircularMarquee;
