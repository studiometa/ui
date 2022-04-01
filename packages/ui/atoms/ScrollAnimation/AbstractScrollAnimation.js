import { Base, withFreezedOptions } from '@studiometa/js-toolkit';
import { matrix, lerp, map, clamp } from '@studiometa/js-toolkit/utils';

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
 * Get animation configuration defaults.
 * @returns {AnimationOptions}
 */
function getDefaults() {
  return {
    x: 0,
    y: 0,
    z: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    skewX: 0,
    skewY: 0,
    opacity: 1,
  };
}

/**
 * @typedef {AbstractScrollAnimation & {
 *   $options: {
 *     playRange: string,
 *     dampFactor: number,
 *     dampPrecision: number,
 *     from: AnimationOptions,
 *     to: AnimationOptions,
 *   },
 * }} ScrollAnimationChildInterface
 */

/**
 * AbstractScrollAnimation class.
 *
 * @todo Add an option to define start and end offset to allow animation to be mapped
 * between custom values: start at 0.1 and end at 0.9 for example.
 *
 * ```js
 * offset.x = { start: 0.1, end: 0.5 }
 *
 * translateX: lerp(from.x, to.x, map(props.progress.y, offset.x.start, offset.x.end, 0, 1))
 * ```
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
 */
export default class AbstractScrollAnimation extends withFreezedOptions(Base) {
  /**
   * Config.
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
        default: getDefaults,
        merge: true,
      },
      to: {
        type: Object,
        default: getDefaults,
        merge: true,
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
   * Flags for style detection.
   */
  get has() {
    const has = {
      x: false,
      y: false,
      z: false,
      scale: false,
      scaleX: false,
      scaleY: false,
      rotate: false,
      skewX: false,
      skewY: false,
      opacity: false,
      transform: false,
    };

    Object.keys(this.$options.from).forEach((key) => {
      has[key] = this.$options.from[key] !== this.$options.to[key];
    });

    has.transform = Object.keys(has)
      .filter((key) => key !== 'opacity' && key !== 'transform')
      .some((key) => has[key]);

    Object.defineProperty(this, 'has', { value: has });

    return has;
  }

  /**
   * @todo do not add unnecessary styles
   */
  scrolledInView(props) {
    if (!this.has.opacity && !this.has.transform) {
      return;
    }

    const progress = map(
      clamp(props.dampedProgress.y, this.$options.playRange[0], this.$options.playRange[1]),
      this.$options.playRange[0],
      this.$options.playRange[1],
      0,
      1
    );

    if (this.has.opacity) {
      this.target.style.opacity = map(
        progress,
        0,
        1,
        this.$options.from.opacity,
        this.$options.to.opacity
      );
    }

    if (this.has.transform) {
      let transform = matrix({
        translateX: this.has.x
          ? lerp(this.$options.from.x, this.$options.to.x, progress)
          : undefined,
        translateY: this.has.y
          ? lerp(this.$options.from.y, this.$options.to.y, progress)
          : undefined,
        // eslint-disable-next-line no-nested-ternary
        scaleX: this.has.scale
          ? lerp(this.$options.from.scale, this.$options.to.scale, progress)
          : this.has.scaleX
          ? lerp(this.$options.from.scaleX, this.$options.to.scaleX, progress)
          : undefined,
        // eslint-disable-next-line no-nested-ternary
        scaleY: this.has.scale
          ? lerp(this.$options.from.scale, this.$options.to.scale, progress)
          : this.has.scaleY
          ? lerp(this.$options.from.scaleY, this.$options.to.scaleY, progress)
          : undefined,
        skewX: this.has.skewX
          ? lerp(this.$options.from.skewX, this.$options.to.skewX, progress)
          : undefined,
        skewY: this.has.skewY
          ? lerp(this.$options.from.skewY, this.$options.to.skewY, progress)
          : undefined,
      });

      if (this.has.rotate) {
        transform += ` rotate(${lerp(this.$options.from.rotate, this.$options.to.rotate, progress)}deg)`;
      }

      transform += `translateZ(${this.has.z ? lerp(this.$options.from.z, this.$options.to.z, progress) : 0})`;
      this.target.style.transform = transform;
    }
  }
}
