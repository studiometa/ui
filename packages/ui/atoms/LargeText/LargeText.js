import { Base, withMountWhenInView } from '@studiometa/js-toolkit';
import { damp, clamp, transform } from '@studiometa/js-toolkit/utils';

/**
 * @typedef {LargeText & {
 *   $refs: { target: HTMLElement },
 *   $options: {
 *     skew: boolean,
 *     sensitivity: number,
 *     skewSensitivity: number,
 *   }
 * }} LargeTextInterface
 */

/**
 * Large text class.
 */
export default class LargeText extends withMountWhenInView(Base, { rootMargin: '50%' }) {
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
   * @type {number}
   */
  x = 0;

  /**
   * Scroll delta Y.
   * @type {number}
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
   * @type {number}
   */
  width = 0;

  /**
   * Set width on mount.
   *
   * @this    {LargeTextInterface}
   * @returns {void}
   */
  mounted() {
    this.width = this.$refs.target.clientWidth;
  }

  /**
   * Set width on resize.
   *
   * @this    {LargeTextInterface}
   * @returns {void}
   */
  resized() {
    this.width = this.$refs.target.clientWidth;
  }

  /**
   * Update delta scroll on scroll.
   *
   * @param   {import('@studiometa/js-toolkit/services/scroll').ScrollServiceProps} props
   * @returns {void}
   */
  scrolled(props) {
    this.deltaY = props.delta.y;
  }

  /**
   * Update values on raf.
   *
   * @this    {LargeTextInterface}
   */
  ticked() {
    this.x -= (Math.abs(this.deltaY) + 1) * this.$options.sensitivity;

    this.transform.x = damp(this.x, this.transform.x, 0.25);

    if (this.$options.skew) {
      this.transform.skewX = damp(
        clamp(this.deltaY * -1, -50, 50) * this.$options.skewSensitivity,
        this.transform.skewX,
        0.25
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
