import { Base } from '@studiometa/js-toolkit';
import { matrix, lerp, map } from '@studiometa/js-toolkit/utils';

/**
 * @typedef {{
 *   x?: number;
 *   y?: number;
 *   z?: number;
 *   scale?: number;
 *   scaleX?: number;
 *   scaleY?: number;
 *   rotate?: number;
 *   skewX?: number;
 *   skewY?: number;
 *   opacity?: number;
 * }} AnimationOptions
 */

/**
 * @typedef {AbstractScrollAnimation & {
 *   $options: {
 *     dampFactor: number,
 *     dampPrecision: number,
 *     from: AnimationOptions,
 *     to: AnimationOptions,
 *   },
 * }} ScrollAnimationChildInterface
 */

/**
 * AbstractScrollAnimation class.
 */
export default class AbstractScrollAnimation extends Base {
  /**
   * Config.
   */
  static config = {
    name: 'AbstractScrollAnimation',
    refs: ['target'],
    options: {
      dampFactor: {
        type: Number,
        default: 0.5,
      },
      dampPrecision: {
        type: Number,
        default: 0.001,
      },
      from: Object,
      to: Object,
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
   * Implement freezed options for better performances.
   *
   * @this {ScrollAnimationChildInterface}
   */
  get freezedOptions() {
    if (!this.__freezedOptions) {
      const { from, to, dampFactor, dampPrecision } = this.$options;
      this.__freezedOptions = Object.freeze({
        dampFactor,
        dampPrecision,
        from: {
          x: from.x ?? 0,
          y: from.y ?? 0,
          z: from.z ?? 0,
          scaleX: from.scaleX ?? from.scale ?? 1,
          scaleY: from.scaleY ?? from.scale ?? 1,
          rotate: from.rotate ?? 0,
          skewX: from.skewX ?? 0,
          skewY: from.skewY ?? 0,
          opacity: from.opacity ?? 1,
        },
        to: {
          x: to.x ?? 0,
          y: to.y ?? 0,
          z: to.z ?? 0,
          scaleX: to.scaleX ?? to.scale ?? 1,
          scaleY: to.scaleY ?? to.scale ?? 1,
          rotate: to.rotate ?? 0,
          skewX: to.skewX ?? 0,
          skewY: to.skewY ?? 0,
          opacity: to.opacity ?? 1,
        },
      });
    }

    return this.__freezedOptions;
  }

  /**
   * @todo do not add unnecessary styles
   */
  scrolledInView(props) {
    const { from, to } = this.freezedOptions;

    this.target.style.opacity = String(
      map(props.dampedProgress.y, 0, 1, from.opacity ?? 1, to.opacity ?? 1)
    );

    this.target.style.transform = `
      ${matrix({
        translateX: lerp(from.x, to.x, props.dampedProgress.y),
        translateY: lerp(from.y, to.y, props.dampedProgress.y),
        scaleX: lerp(from.scaleX, to.scaleX, props.dampedProgress.y),
        scaleY: lerp(from.scaleY, to.scaleY, props.dampedProgress.y),
        skewX: lerp(from.skewX, to.skewX, props.dampedProgress.y),
        skewY: lerp(from.skewY, to.skewY, props.dampedProgress.y),
      })}
      rotate(${lerp(from.rotate, to.rotate, props.dampedProgress.y)}deg)
      translateZ(${lerp(from.z, to.z, props.dampedProgress.y)})
    `;
  }
}
