import { withScrolledInView } from '@studiometa/js-toolkit';
import AbstractScrollAnimation from './AbstractScrollAnimation.js';

/**
 * @typedef {{ $refs: { target: HTMLElement }}} ScrollAnimationInterface
 */

/**
 * ScrollAnimation class.
 * @extends {AbstractScrollAnimation<ScrollAnimationInterface>}
 */
export default class ScrollAnimation extends withScrolledInView(AbstractScrollAnimation, {}) {
  /**
   * Config.
   */
  static config = {
    ...AbstractScrollAnimation.config,
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
    return this.$options.dampFactor;
  }

  /**
   * Get the damp precision from the freezed options.
   * @returns {number}
   */
  get dampPrecision() {
    return this.$options.dampPrecision;
  }
}
