import { Base, withMountWhenInView } from '@studiometa/js-toolkit';
import { damp, matrix, clamp, nextFrame } from '@studiometa/js-toolkit/utils';

/**
 * @typedef {LargeText & { $refs: { target: HTMLElement } }} LargeTextInterface
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
  };

  /**
   * Translate X.
   * @type {number}
   */
  translateX = 0;

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
    translateX: 0,
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
   * @returns {void}
   */
  ticked() {
    this.translateX -= Math.abs(this.deltaY) + 1;

    this.transform.translateX = damp(this.translateX, this.transform.translateX, 0.25);

    this.transform.skewX = damp(
      clamp((this.deltaY / 20) * -1, -0.5, 0.5),
      this.transform.skewX,
      0.25
    );

    if (Math.abs(this.transform.translateX) >= this.width) {
      this.translateX = 0;
      this.transform.translateX = 0;
    }

    // Defer DOM update to the next frame
    nextFrame(() => {
      // eslint-disable-next-line prefer-template
      this.$refs.target.style.transform = matrix(this.transform) + ' translateZ(0px)';
    });
  }
}
