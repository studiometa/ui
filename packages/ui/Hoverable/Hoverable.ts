import { Base, withRelativePointer } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps, PointerServiceProps } from '@studiometa/js-toolkit';
import { map, transform, damp, getOffsetSizes, clamp01 } from '@studiometa/js-toolkit/utils';

export interface HoverableProps extends BaseProps {
  $refs: {
    /**
     * Target element that will be moved on hover.
     */
    target: HTMLElement;
  };
  $options: {
    /**
     * A number between in the range `0–1` used to smoothen the transition between each position.
     */
    sensitivity: number;
    /**
     * Wether to reverse the movement of the target or not.
     */
    reversed: boolean;
    /**
     * Wether to stop moving the target when the mouse is not over the root element or not.
     */
    contained: boolean;
    /**
     * The bounding shape used to constrain the target movement.
     */
    shape: 'rect' | 'circle' | 'ellipse';
  };
}

/**
 * Hoverable class.
 * @link https://ui.studiometa.dev/components/Hoverable/
 */
export class Hoverable<T extends BaseProps = BaseProps> extends withRelativePointer(Base)<
  T & HoverableProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Hoverable',
    refs: ['target'],
    options: {
      sensitivity: {
        type: Number,
        default: 0.1,
      },
      reversed: Boolean,
      contained: Boolean,
      shape: {
        type: String,
        default: 'rect',
      },
    },
  };

  props = {
    x: 0,
    y: 0,
    dampedX: 0,
    dampedY: 0,
  };

  /**
   * The hoverable element, defaults to `this.$refs.target`.
   */
  get target(): HTMLElement {
    return this.$refs.target;
  }

  /**
   * The bouding element, defaults to `this.$el`.
   */
  get parent(): HTMLElement {
    return this.$el;
  }

  /**
   * The bounds values in which the target can move.
   */
  get bounds() {
    const targetSizes = getOffsetSizes(this.target);
    const parentSizes = getOffsetSizes(this.parent);
    const xMin = targetSizes.x - parentSizes.x;
    const yMin = targetSizes.y - parentSizes.y;
    const xMax = xMin + targetSizes.width - parentSizes.width;
    const yMax = yMin + targetSizes.height - parentSizes.height;

    return {
      yMin: yMin * -1,
      yMax: yMax * -1,
      xMin: xMin * -1,
      xMax: xMax * -1,
    };
  }

  /**
   * Constrain a position to the configured bounding shape.
   */
  constrainPosition(x: number, y: number, bounds = this.bounds) {
    const { shape } = this.$options;

    if (shape === 'circle' || shape === 'ellipse') {
      const { xMin, xMax, yMin, yMax } = bounds;
      const centerX = (xMin + xMax) / 2;
      const centerY = (yMin + yMax) / 2;
      const deltaX = x - centerX;
      const deltaY = y - centerY;
      const radiusX = (xMax - xMin) / 2;
      const radiusY = (yMax - yMin) / 2;
      const minRadius = Math.min(radiusX, radiusY);
      const constrainedRadiusX = shape === 'circle' ? minRadius : radiusX;
      const constrainedRadiusY = shape === 'circle' ? minRadius : radiusY;

      if (constrainedRadiusX <= 0 || constrainedRadiusY <= 0) {
        return { x: centerX, y: centerY };
      }

      const ratio =
        (deltaX * deltaX) / (constrainedRadiusX * constrainedRadiusX) +
        (deltaY * deltaY) / (constrainedRadiusY * constrainedRadiusY);

      if (ratio <= 1) {
        return { x, y };
      }

      const scale = 1 / Math.sqrt(ratio);

      return {
        x: centerX + deltaX * scale,
        y: centerY + deltaY * scale,
      };
    }

    return { x, y };
  }

  /**
   * Update props when the mouse moves.
   */
  movedrelative({ progress }: PointerServiceProps) {
    const { bounds, props } = this;
    const { reversed, contained } = this.$options;
    const { x, y } = progress;

    // Stop updating when pointer is outside of the parent bounds
    if (contained && (y < 0 || x < 0 || y > 1 || x > 1)) {
      return;
    }

    const from = reversed ? 1 : 0;
    const to = reversed ? 0 : 1;
    const position = this.constrainPosition(
      map(clamp01(x), from, to, bounds.xMin, bounds.xMax),
      map(clamp01(y), from, to, bounds.yMin, bounds.yMax),
      bounds,
    );

    props.x = position.x;
    props.y = position.y;
  }

  /**
   * Update target position on each frame.
   */
  ticked() {
    const { props, target } = this;
    const { sensitivity } = this.$options;
    props.dampedY = damp(props.y, props.dampedY, sensitivity);
    props.dampedX = damp(props.x, props.dampedX, sensitivity);

    return () => {
      transform(target, {
        y: props.dampedY,
        x: props.dampedX,
      });
    };
  }
}
