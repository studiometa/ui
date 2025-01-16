import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, PointerServiceProps, BaseProps } from '@studiometa/js-toolkit';
import { damp, matrix } from '@studiometa/js-toolkit/utils';

export interface CursorProps extends BaseProps {
  $options: {
    growSelectors: string;
    shrinkSelectors: string;
    scale: number;
    growTo: number;
    shrinkTo: number;
    translateDampFactor: number;
    growDampFactor: number;
    shrinkDampFactor: number;
  };
}

/**
 * Cursor class.
 */
export class Cursor<T extends BaseProps = BaseProps> extends Base<CursorProps & T> {
  static config: BaseConfig = {
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

  x = 0;

  y = 0;

  scale = 0;

  pointerX = 0;

  pointerY = 0;

  pointerScale = 0;

  /**
   * Mounted hook.
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
   */
  moved({ event, x, y, isDown }: PointerServiceProps) {
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
   */
  ticked() {
    this.x = damp(this.pointerX, this.x, this.$options.translateDampFactor);
    this.y = damp(this.pointerY, this.y, this.$options.translateDampFactor);
    this.scale = damp(
      this.pointerScale,
      this.scale,
      this.pointerScale < this.scale
        ? this.$options.shrinkDampFactor
        : this.$options.growDampFactor,
    );

    this.render({ x: this.x, y: this.y, scale: this.scale });

    if (this.x === this.pointerX && this.y === this.pointerY && this.scale === this.pointerScale) {
      this.$services.disable('ticked');
    }
  }

  /**
   * Render the cursor.
   */
  render({ x, y, scale }: { x: number; y: number; scale: number }) {
    const transform = matrix({
      translateX: x,
      translateY: y,
      scaleX: scale,
      scaleY: scale,
    });
    this.$el.style.transform = `translateZ(0) ${transform}`;
  }
}
