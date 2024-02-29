import { Base, BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { damp, transform } from '@studiometa/js-toolkit/utils';

export interface CircularMarqueeProps extends BaseProps {
  $options: {
    sensitivity: number;
  };
}

/**
 * CircularMarquee component
 */
export class CircularMarquee extends Base<CircularMarqueeProps> {
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

  scrolled(props) {
    this.deltaY = props.delta.y;
  }

  ticked() {
    this.rotate -= (Math.abs(this.deltaY) + 1) * this.$options.sensitivity;

    this.transform.rotate = damp(this.rotate, this.transform.rotate, 0.25);

    return () => {
      transform(this.$el, this.transform);
    };
  }
}
