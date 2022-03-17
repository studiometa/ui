import { withScrolledInView } from '@studiometa/js-toolkit';
import AbstractScrollAnimation from './AbstractScrollAnimation.js';

/**
 * @typedef {ScrollAnimation & { $refs: { target: HTMLElement }}} ScrollAnimationInterface
 */

/**
 * ScrollAnimation class.
 */
export default class ScrollAnimation extends withScrolledInView(AbstractScrollAnimation, {}) {
  /**
   * Config.
   */
  static config = {
    name: 'ScrollAnimation',
    refs: ['target'],
  };

  /**
   * Use the `target` ref as animation target.
   *
   * @this    {ScrollAnimationInterface}
   * @returns {HTMLElement}
   */
  get target() {
    return this.$refs.target;
  }

  /**
   * Get the damp factor from the freezed options.
   * @returns {number}
   */
  get dampFactor() {
    return this.freezedOptions.dampFactor;
  }

  /**
   * Get the damp precision from the freezed options.
   * @returns {number}
   */
  get dampPrecision() {
    return this.freezedOptions.dampPrecision;
  }
}
