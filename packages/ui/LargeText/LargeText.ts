import { Base, withMountWhenInView } from '@studiometa/js-toolkit';
import type { BaseProps, BaseInterface, ScrollServiceProps } from '@studiometa/js-toolkit';
import { damp, clamp, transform } from '@studiometa/js-toolkit/utils';

export interface LargeTextProps extends BaseProps {
  $refs: {
    target: HTMLElement;
  };
  $options: {
    skew: boolean;
    sensitivity: number;
    skewSensitivity: number;
  };
}

/**
 * LargeText class.
 * @link https://ui.studiometa.dev/components/LargeText/
 */
export class LargeText<T extends BaseProps = BaseProps>
  extends withMountWhenInView(Base, { rootMargin: '50%' })<T & LargeTextProps>
  implements BaseInterface
{
  /**
   * Config.
   */
  static config = {
    name: 'LargeText',
    refs: ['target'],
    options: {
      skew: Boolean,
      sensitivity: {
        type: Number,
        default: 1,
      },
      skewSensitivity: {
        type: Number,
        default: 1,
      },
    },
  };

  /**
   * Translate X.
   */
  x = 0;

  /**
   * Scroll delta Y.
   */
  deltaY = 0;

  /**
   * Transform values.
   */
  transform = {
    skewX: 0,
    x: 0,
  };

  /**
   * Target width.
   */
  width = 0;

  /**
   * Set width on mount.
   */
  mounted() {
    this.width = this.$refs.target.clientWidth;
  }

  /**
   * Set width on resize.
   */
  resized() {
    this.width = this.$refs.target.clientWidth;
  }

  /**
   * Update delta scroll on scroll.
   */
  scrolled(props: ScrollServiceProps) {
    this.deltaY = props.delta.y;
  }

  /**
   * Update values on raf.
   */
  ticked() {
    this.x -= (Math.abs(this.deltaY) + 1) * this.$options.sensitivity;

    this.transform.x = damp(this.x, this.transform.x, 0.25);

    if (this.$options.skew) {
      this.transform.skewX = damp(
        clamp(this.deltaY * -1, -50, 50) * this.$options.skewSensitivity,
        this.transform.skewX,
        0.25,
      );
    }

    if (this.x <= this.width * -1) {
      this.x = 0;
      this.transform.x += this.width;
    } else if (this.$options.sensitivity < 0 && this.x >= this.width) {
      this.x = 0;
      this.transform.x -= this.width;
    }

    return () => {
      transform(this.$refs.target, this.transform);
    };
  }
}
