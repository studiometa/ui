import { Base } from '@studiometa/js-toolkit';
import { damp, matrix } from '@studiometa/js-toolkit/utils';

/**
 * @typedef {import('@studiometa/js-toolkit/services/pointer').PointerServiceProps} PointerServiceProps
 * @typedef {import('@studiometa/js-toolkit/Base').BaseOptions} BaseOptions
 */

/**
 * @typedef {Object} CursorOptions
 * @property {string} growSelectors
 * @property {string} shrinkSelectors
 * @property {number} scale
 * @property {number} growTo
 * @property {number} shrinkTo
 * @property {number} translateDampFactor
 * @property {number} growDampFactor
 * @property {number} shrinkDampFactor
 */

/**
 * @typedef {Object} CursorPrivateInterface
 * @property {BaseOptions & CursorOptions} $options
 */

/**
 * @typedef {Cursor & CursorPrivateInterface} CursorInterface
 */

/**
 * Custom cursor component.
 */
export default class Cursor extends Base {
  /**
   * Class config.
   */
  static config = {
    name: 'Cursor',
    options: {
      growSelectors: {
        type: String,
        default: 'a, a *, button, button *, [data-cursor-grow], [data-cursor-grow] *',
      },
      shrinkSelectors: {
        type: String,
        default: '[data-cursor-shrink], [data-cursor-shrink] *',
      },
      scale: {
        type: Number,
        default: 1,
      },
      growTo: {
        type: Number,
        default: 2,
      },
      shrinkTo: {
        type: Number,
        default: 0.5,
      },
      translateDampFactor: {
        type: Number,
        default: 0.25,
      },
      growDampFactor: {
        type: Number,
        default: 0.25,
      },
      shrinkDampFactor: {
        type: Number,
        default: 0.25,
      },
    },
  };

  /**
   * @type {number}
   */
  x = 0;

  /**
   * @type {number}
   */
  y = 0;

  /**
   * @type {number}
   */
  scale = 0;

  /**
   * @type {number}
   */
  pointerX = 0;

  /**
   * @type {number}
   */
  pointerY = 0;

  /**
   * @type {number}
   */
  pointerScale = 0;

  /**
   * Mounted hook.
   * @return {void}
   */
  mounted() {
    this.x = 0;
    this.y = 0;
    this.scale = 0;
    this.pointerX = 0;
    this.pointerY = 0;
    this.pointerScale = 0;
    this.render({ x: this.x, y: this.y, scale: this.scale });
  }

  /**
   * Moved hook.
   *
   * @this {CursorInterface}
   *
   * @param {PointerServiceProps} options
   * @return {void}
   */
  moved({ event, x, y, isDown }) {
    if (!this.$services.has('ticked')) {
      this.$services.enable('ticked');
    }

    this.pointerX = x;
    this.pointerY = y;

    let { scale } = this.$options;

    if (!event) {
      this.pointerScale = scale;
      return;
    }

    const shouldGrow =
      (event.target instanceof Element && event.target.matches(this.$options.growSelectors)) ||
      false;
    const shouldReduce =
      isDown ||
      (event.target instanceof Element && event.target.matches(this.$options.shrinkSelectors)) ||
      false;

    if (shouldGrow) {
      scale = this.$options.growTo;
    }

    if (shouldReduce) {
      scale = this.$options.shrinkTo;
    }

    this.pointerScale = scale;
  }

  /**
   * RequestAnimationFrame hook.
   *
   * @this {CursorInterface}
   *
   * @return {void}
   */
  ticked() {
    this.x = damp(this.pointerX, this.x, this.$options.translateDampFactor);
    this.y = damp(this.pointerY, this.y, this.$options.translateDampFactor);
    this.scale = damp(
      this.pointerScale,
      this.scale,
      this.pointerScale < this.scale ? this.$options.shrinkDampFactor : this.$options.growDampFactor
    );

    this.render({ x: this.x, y: this.y, scale: this.scale });

    if (this.x === this.pointerX && this.y === this.pointerY && this.scale === this.pointerScale) {
      this.$services.disable('ticked');
    }
  }

  /**
   * Render the cursor.
   *
   * @param  {Object} options
   * @param  {number} options.x
   * @param  {number} options.y
   * @param  {number} options.scale
   * @return {void}
   */
  render({ x, y, scale }) {
    const transform = matrix({
      translateX: x,
      translateY: y,
      scaleX: scale,
      scaleY: scale,
    });
    this.$el.style.transform = `translateZ(0) ${transform}`;
  }
}
