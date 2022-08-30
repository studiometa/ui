import { Base, withFreezedOptions } from '@studiometa/js-toolkit';
import { map, clamp, animate } from '@studiometa/js-toolkit/utils';

/**
 * @typedef {import('@studiometa/js-toolkit').BaseTypeParameter} BaseTypeParameter
 * @typedef {typeof AbstractScrollAnimation} AbstractScrollAnimationConstructor
 * @typedef {import('@studiometa/js-toolkit/utils/css/animate.js').Keyframe} Keyframe
 */

/**
 * @typedef {AbstractScrollAnimation & {
 *   $options: {
 *     playRange: string,
 *     dampFactor: number,
 *     dampPrecision: number,
 *     from: Keyframe,
 *     to: Keyframe,
 *     keyframes: Keyframe[],
 *   },
 * }} ScrollAnimationChildInterface
 */

/**
 * AbstractScrollAnimation class.
 *
 * @todo add support for magic values in options to access key values:
 * - viewport size
 * - target size
 * - root element size
 * - etc.
 *
 * ```
 * data-option-to="{ x: 100%, y: innerWidth / 2 }"
 * ```
 * @template {BaseTypeParameter} [T=BaseTypeParameter]
 */
export default class AbstractScrollAnimation extends withFreezedOptions(Base) {
  /**
   * Config.
   * @type {import('@studiometa/js-toolkit').BaseConfig}
   */
  static config = {
    name: 'AbstractScrollAnimation',
    options: {
      playRange: {
        type: Array,
        default: () => [0, 1],
      },
      dampFactor: {
        type: Number,
        default: 0.5,
      },
      dampPrecision: {
        type: Number,
        default: 0.001,
      },
      from: {
        type: Object,
        default: () => ({}),
      },
      to: {
        type: Object,
        default: () => ({}),
      },
      keyframes: {
        type: Array,
      },
      easing: {
        type: Array,
        default: () => [0, 0, 1, 1],
      },
    },
  };

  /**
   * Get the target element for the animation.
   *
   * @returns {HTMLElement}
   */
  get target() {
    return this.$el;
  }

  /**
   * @type {ReturnType<animate>}
   */
  animation;

  /**
   * @this {ScrollAnimationChildInterface}
   * @returns {void}
   */
  mounted() {
    let { keyframes } = this.$options;
    const { from, to } = this.$options;

    if (keyframes.length <= 0 && from && to) {
      keyframes = [from, to];
    }

    this.animation = animate(this.target, keyframes, { easing: this.$options.easing });
  }

  /**
   * @todo do not add unnecessary styles
   */
  scrolledInView(props) {
    const progress = map(
      clamp(props.dampedProgress.y, this.$options.playRange[0], this.$options.playRange[1]),
      this.$options.playRange[0],
      this.$options.playRange[1],
      0,
      1,
    );

    this.render(progress);
  }

  /**
   * Render the animation for the given progress.
   *
   * @param   {number} progress
   * @returns {void}
   */
  render(progress) {
    this.animation.progress(progress);
  }
}
