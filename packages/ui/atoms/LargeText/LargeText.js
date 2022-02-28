import { Base, withMountWhenInView } from '@studiometa/js-toolkit';
import { damp, matrix, clamp, nextFrame } from '@studiometa/js-toolkit/utils';

/**
 * Large text class.
 */
export default class LargeText extends withMountWhenInView(Base, { rootMargin: '50%' }) {
  static config = {
    name: 'LargeText',
    refs: ['target'],
  };

  translateX = 0;

  t = performance.now();

  transform = {
    skewX: 0,
    translateX: 0,
  };

  deltaY = 0;

  width = 0;

  /**
   * Set width on mount.
   * @returns {void}
   */
  mounted() {
    this.width = this.$refs.target.clientWidth;
  }

  /**
   * Set width on resize.
   * @returns {void}
   */
  resized() {
    this.width = this.$refs.target.clientWidth;
  }

  /**
   * Update delta scroll on scroll.
   *
   * @param   {import('@studiometa/js-toolkit').ScrollServiceProps} props
   * @returns {void}
   */
  scrolled(props) {
    this.deltaY = props.delta.y;
  }

  /**
   * Update values on raf.
   *
   * @param   {import('@studiometa/js-toolkit').RafServiceProps} props
   * @returns {void}
   */
  ticked(props) {
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

    this.t = props.time;

    // Defer DOM update to the next frame
    nextFrame(() => {
      // eslint-disable-next-line prefer-template
      this.$refs.target.style.transform = matrix(this.transform) + ' translateZ(0px)';
    });
  }
}
