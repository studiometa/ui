import { Base } from '@studiometa/js-toolkit';
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
export default class AbstractScrollAnimation extends Base {
  /**
   * Config.
   */
  static config = {
    name: 'AbstractScrollAnimation',
    options: {
      playRange: {
        type: String,
        default: '0,1',
      },
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
    const withDefaults = (config) => ({
      x: config.x ?? 0,
      y: config.y ?? 0,
      z: config.z ?? 0,
      scaleX: config.scaleX ?? config.scale ?? 1,
      scaleY: config.scaleY ?? config.scale ?? 1,
      rotate: config.rotate ?? 0,
      skewX: config.skewX ?? 0,
      skewY: config.skewY ?? 0,
      opacity: config.opacity ?? 1,
    });

    const freezedOptions = Object.freeze({
      playRange: this.$options.playRange.split(',').map(Number),
      dampFactor: this.$options.dampFactor,
      dampPrecision: this.$options.dampPrecision,
      from: withDefaults(this.$options.from),
      to: withDefaults(this.$options.to),
    });

    Object.defineProperty(this, 'freezedOptions', {
      value: freezedOptions,
    });

    return freezedOptions;
  }

  /**
   * Flags for style detection.
   */
  get has() {
    const { freezedOptions } = this;
    const has = {
      x: false,
      y: false,
      z: false,
      scaleX: false,
      scaleY: false,
      rotate: false,
      skewX: false,
      skewY: false,
      opacity: false,
      transform: false,
    };

    Object.keys(freezedOptions.from).forEach((key) => {
      has[key] = freezedOptions.from[key] !== freezedOptions.to[key];
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
      clamp(
        props.dampedProgress.y,
        this.freezedOptions.playRange[0],
        this.freezedOptions.playRange[1]
      ),
      this.freezedOptions.playRange[0],
      this.freezedOptions.playRange[1],
      0,
      1
    );

    if (this.has.opacity) {
      // @ts-ignore
      this.target.style.opacity = map(
        progress,
        0,
        1,
        this.freezedOptions.from.opacity,
        this.freezedOptions.to.opacity
      );
    }

    if (this.has.transform) {
      this.target.style.transform = `
        ${matrix({
          translateX: this.has.x
            ? lerp(this.freezedOptions.from.x, this.freezedOptions.to.x, progress)
            : undefined,
          translateY: this.has.y
            ? lerp(this.freezedOptions.from.y, this.freezedOptions.to.y, progress)
            : undefined,
          scaleX: this.has.scaleX
            ? lerp(this.freezedOptions.from.scaleX, this.freezedOptions.to.scaleX, progress)
            : undefined,
          scaleY: this.has.scaleY
            ? lerp(this.freezedOptions.from.scaleY, this.freezedOptions.to.scaleY, progress)
            : undefined,
          skewX: this.has.skewX
            ? lerp(this.freezedOptions.from.skewX, this.freezedOptions.to.skewX, progress)
            : undefined,
          skewY: this.has.skewY
            ? lerp(this.freezedOptions.from.skewY, this.freezedOptions.to.skewY, progress)
            : undefined,
        })}
        rotate(${
          this.has.rotate
            ? lerp(this.freezedOptions.from.rotate, this.freezedOptions.to.rotate, progress)
            : 0
        }deg)
        translateZ(${
          this.has.z ? lerp(this.freezedOptions.from.z, this.freezedOptions.to.z, progress) : 0
        })
      `;
    }
  }
}
