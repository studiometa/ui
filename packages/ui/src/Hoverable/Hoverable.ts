import { Base } from '@studiometa/js-toolkit/Base';
import { withPointer } from '@studiometa/js-toolkit/withPointer';
import { withRaf } from '@studiometa/js-toolkit/withRaf';
import type { BaseConfig, BaseProps, ElementPointerProps, RafProps } from '@studiometa/js-toolkit';
import { getOffsetSizes } from '@studiometa/js-toolkit/utils/getOffsetSizes';
import { clamp01 } from '@studiometa/js-toolkit/utils/clamp01';
import { damp } from '@studiometa/js-toolkit/utils/damp';
import { map } from '@studiometa/js-toolkit/utils/map';
import { transform } from '@studiometa/js-toolkit/utils/transform';

/**
 * The shape the target position is constrained to, inscribed in the
 * rectangle given by the `bounds` getter.
 */
export const HOVERABLE_SHAPES = /* @__PURE__ */ Object.freeze({
  RECT: 'rect',
  CIRCLE: 'circle',
  ELLIPSE: 'ellipse',
} as const);

/** One of {@link HOVERABLE_SHAPES}. */
export type HoverableShape = (typeof HOVERABLE_SHAPES)[keyof typeof HOVERABLE_SHAPES];

/** A position of the target, in pixels. */
export interface HoverablePosition {
  x: number;
  y: number;
}

export interface HoverableBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export type HoverableProps = BaseProps & {
  $refs: { target: HTMLElement };
  $options: {
    /** A number in `0–1` that smoothens the transition between each position. */
    sensitivity: number;
    /** Reverse the movement of the target. */
    reversed: boolean;
    /** Stop moving the target once the pointer leaves the root element. */
    contained: boolean;
    /** The shape the target position is constrained to. */
    shape: HoverableShape;
  };
};

/**
 * The mixed-in base class, built in a declaration of its own: the TypeScript
 * transform drops a `@__PURE__` annotation placed after `extends`, and an
 * unannotated call keeps the whole module in a bundle that only imports
 * `HOVERABLE_SHAPES`.
 */
const HoverableBase = /* @__PURE__ */ withRaf(/* @__PURE__ */ withPointer(Base));

/**
 * Moves a `target` ref in response to the pointer's position over the root
 * element. The target is mapped across its available bounds and damped each
 * frame by the `sensitivity` option; `reversed` inverts the movement and
 * `contained` stops it once the pointer leaves the element. The `shape` option
 * constrains the position to a circle or an ellipse inscribed in the bounds.
 *
 * @link https://ui.studiometa.dev/reference/items/Hoverable/
 */
export class Hoverable<T extends BaseProps = BaseProps> extends HoverableBase<HoverableProps & T> {
  static config: BaseConfig = {
    name: 'Hoverable',
    refs: ['target'],
    options: {
      sensitivity: { type: Number, default: 0.1 },
      reversed: Boolean,
      contained: Boolean,
      // A literal rather than `HOVERABLE_SHAPES.RECT`: a property read at the top level keeps
      // the whole module in a bundle that only imports the constant.
      shape: { type: String, default: 'rect' satisfies HoverableShape },
    },
  };

  props = {
    x: 0,
    y: 0,
    dampedX: 0,
    dampedY: 0,
  };

  /** The hoverable element, defaults to `this.$refs.target`. */
  get target(): HTMLElement {
    return this.$refs.target;
  }

  /** The bounding element, defaults to `this.$el`. */
  get parent(): HTMLElement {
    return this.$el;
  }

  /** The bounds in which the target can move. */
  get bounds(): HoverableBounds {
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
   * Constrain a position to the shape given by the `shape` option. Override
   * this method to constrain the target to another shape.
   */
  constrainPosition(x: number, y: number, bounds = this.bounds): HoverablePosition {
    const { shape } = this.$options;

    if (shape !== HOVERABLE_SHAPES.CIRCLE && shape !== HOVERABLE_SHAPES.ELLIPSE) {
      return { x, y };
    }

    // The bounds are inverted when the target is smaller than its parent.
    const centerX = (bounds.xMin + bounds.xMax) / 2;
    const centerY = (bounds.yMin + bounds.yMax) / 2;
    let radiusX = Math.abs(bounds.xMax - bounds.xMin) / 2;
    let radiusY = Math.abs(bounds.yMax - bounds.yMin) / 2;

    if (shape === HOVERABLE_SHAPES.CIRCLE) {
      radiusX = radiusY = Math.min(radiusX, radiusY);
    }

    if (radiusX === 0 || radiusY === 0) {
      return { x: centerX, y: centerY };
    }

    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const ratio = (deltaX / radiusX) ** 2 + (deltaY / radiusY) ** 2;

    if (ratio <= 1) {
      return { x, y };
    }

    // Bring the position back onto the edge, along the line to the center.
    const scale = 1 / Math.sqrt(ratio);

    return { x: centerX + deltaX * scale, y: centerY + deltaY * scale };
  }

  moved({ relativeProgressX, relativeProgressY }: ElementPointerProps): void {
    const { bounds, props } = this;
    const { reversed, contained } = this.$options;

    // Stop updating when the pointer is outside the parent bounds.
    if (
      contained &&
      (relativeProgressY < 0 ||
        relativeProgressX < 0 ||
        relativeProgressY > 1 ||
        relativeProgressX > 1)
    ) {
      return;
    }

    const from = reversed ? 1 : 0;
    const to = reversed ? 0 : 1;

    const { x, y } = this.constrainPosition(
      map(clamp01(relativeProgressX), from, to, bounds.xMin, bounds.xMax),
      map(clamp01(relativeProgressY), from, to, bounds.yMin, bounds.yMax),
      bounds,
    );

    props.x = x;
    props.y = y;
  }

  ticked({ delta }: RafProps): void {
    const { props, target } = this;
    const { sensitivity } = this.$options;
    props.dampedY = damp(props.y, props.dampedY, sensitivity, delta);
    props.dampedX = damp(props.x, props.dampedX, sensitivity, delta);

    this.$write(() => {
      target.style.transform = transform({ x: props.dampedX, y: props.dampedY });
    });
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Hoverable`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Hoverable;
