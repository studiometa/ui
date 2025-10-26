import { Base, withDrag } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig, DragServiceProps } from '@studiometa/js-toolkit';
import {
  clamp,
  damp,
  domScheduler,
  getOffsetSizes,
  map,
  transform,
} from '@studiometa/js-toolkit/utils';

export interface DraggableProps extends BaseProps {
  $refs: {
    target: HTMLElement;
  };
  $options: {
    x: boolean;
    y: boolean;
    fitBounds: boolean;
    strictFitBounds: boolean;
    sensitivity: number;
    dropSensitivity: number;
    margin: string;
  };
}

/**
 * Draggable class.
 * @link https://ui.studiometa.dev/-/components/Draggable/
 */
export class Draggable<T extends BaseProps = BaseProps> extends withDrag(Base, {
  // @ts-expect-error draggable is instance of Draggable.
  target: (draggable) => draggable.target,
})<T & DraggableProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Draggable',
    refs: ['target'],
    emits: [
      'drag-start',
      'drag-drag',
      'drag-drop',
      'drag-inertia',
      'drag-stop',
      'drag-fit',
      'drag-render',
    ],
    options: {
      x: {
        type: Boolean,
        default: true,
      },
      y: {
        type: Boolean,
        default: true,
      },
      fitBounds: Boolean,
      strictFitBounds: Boolean,
      sensitivity: { type: Number, default: 0.5 },
      dropSensitivity: { type: Number, default: 0.1 },
      margin: { type: String, default: '0' },
    },
  };

  /**
   * Props for the target position.
   */
  props = {
    x: 0,
    y: 0,
    progressX: 0,
    progressY: 0,
    originX: 0,
    originY: 0,
    dampedX: 0,
    dampedY: 0,
  };

  /**
   * Smooth factor.
   */
  dampFactor = 0.5;

  /**
   * The draggable element, defaults to `this.$refs.target`.
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
   * Draggable area bounds.
   * @private Use the `bounds` getter instead.
   */
  __bounds: {
    yMin: number;
    yMax: number;
    xMin: number;
    xMax: number;
  };

  /**
   * Cached margin values.
   * @private
   */
  __margin: { top: number; right: number; bottom: number; left: number };

  /**
   * Cached margin option for invalidation.
   * @private
   */
  __marginOption: string;

  /**
   * Offset from the bounds.
   */
  get margin() {
    const marginOption = this.$options.margin;

    if (this.__margin && this.__marginOption === marginOption) {
      return this.__margin;
    }

    const values = marginOption.split(' ').map(Number);
    let [top = 0] = values;
    let right = top;
    let bottom = top;
    let left = top;

    switch (values.length) {
      case 4:
        [top, right, bottom, left] = values;
        break;
      case 3:
        [top, right, bottom] = values;
        left = right;
        break;
      case 2:
        [top, right] = values;
        left = right;
        bottom = top;
        break;
    }

    this.__margin = { top, right, bottom, left };
    this.__marginOption = marginOption;

    return this.__margin;
  }

  /**
   * Draggable area bounds.
   */
  get bounds() {
    if (!this.__bounds) {
      const { target, parent, margin } = this;
      const targetSizes = getOffsetSizes(target);
      const parentSizes = getOffsetSizes(parent);
      const xMin = targetSizes.x - parentSizes.x;
      const yMin = targetSizes.y - parentSizes.y;
      const xMax = xMin + targetSizes.width - parentSizes.width;
      const yMax = yMin + targetSizes.height - parentSizes.height;

      this.__bounds = {
        yMin: (yMin - margin.top) * -1,
        yMax: (yMax + margin.bottom) * -1,
        xMin: (xMin - margin.left) * -1,
        xMax: (xMax + margin.right) * -1,
      };
    }

    return this.__bounds;
  }

  /**
   * Resized hook.
   * Reset bounds on resize.
   */
  resized() {
    this.__bounds = null;
  }

  /**
   * Drag service hook.
   */
  dragged(props: DragServiceProps) {
    this.$emit(`drag-${props.mode}`, this.props);
    const { fitBounds, strictFitBounds, sensitivity, dropSensitivity } = this.$options;
    const { bounds } = this;

    if (props.mode === props.MODES.START) {
      this.props.originX = this.props.x;
      this.props.originY = this.props.y;
      this.dampFactor = sensitivity;
      this.render();
    } else if (
      props.mode === props.MODES.DRAG ||
      (props.mode === props.MODES.INERTIA && !fitBounds)
    ) {
      this.props.x = this.props.originX + props.x - props.origin.x;
      this.props.y = this.props.originY + props.y - props.origin.y;

      if (strictFitBounds) {
        this.props.x = clamp(this.props.x, bounds.xMin, bounds.xMax);
        this.props.y = clamp(this.props.y, bounds.yMin, bounds.yMax);
      }

      this.render();
    } else if (props.mode === props.MODES.DROP && fitBounds) {
      this.props.x = clamp(
        this.props.originX + props.final.x - props.origin.x,
        bounds.xMin,
        bounds.xMax,
      );
      this.props.y = clamp(
        this.props.originY + props.final.y - props.origin.y,
        bounds.yMin,
        bounds.yMax,
      );
      this.dampFactor = dropSensitivity;
      this.$services.enable('ticked');
    }
  }

  ticked() {
    this.$emit(`drag-inertia`, this.props);
    this.render();
    if (this.props.dampedX === this.props.x && this.props.dampedY === this.props.y) {
      this.$services.disable('ticked');
      this.$emit('drag-fit', this.props);
    }
  }

  render() {
    const { props } = this;
    props.dampedX = damp(props.x, props.dampedX, this.dampFactor);
    props.dampedY = damp(props.y, props.dampedY, this.dampFactor);

    domScheduler.read(() => {
      const { bounds } = this;
      const { x, y } = this.$options;

      domScheduler.write(() => {
        props.progressX = map(props.x, bounds.xMin, bounds.xMax, 0, 1);
        props.progressY = map(props.y, bounds.yMin, bounds.yMax, 0, 1);

        transform(this.target, {
          x: x ? props.dampedX : 0,
          y: y ? props.dampedY : 0,
        });

        this.$emit('drag-render', this.props);
      });
    });
  }
}
