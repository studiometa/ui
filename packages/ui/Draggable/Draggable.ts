import { Base, withDrag, DragService } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig, DragServiceProps } from '@studiometa/js-toolkit';
import { domScheduler, transform, damp, clamp } from '@studiometa/js-toolkit/utils';

export interface DraggableProps extends BaseProps {
  $refs: {
    target: HTMLElement;
  };
  $options: {
    fitBounds: boolean;
    sensitivity: number;
    dropSensitivity: number;
  };
}

/**
 * Draggable class.
 */
export class Draggable<T extends BaseProps = BaseProps> extends withDrag(Base, {
  // @ts-expect-error draggable is instance of Draggable.
  target: (draggable) => draggable.target,
})<T & DraggableProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'DraggableElement',
    refs: ['target'],
    options: {
      fitBounds: Boolean,
      sensitivity: { type: Number, default: 0.5 },
      dropSensitivity: { type: Number, default: 0.1 },
    },
  };

  /**
   * Horizontal transformation.
   */
  x = 0;

  /**
   * Vertical transformation.
   */
  y = 0;

  /**
   * Horizontal position origin.
   */
  originX = 0;

  /**
   * Vertical position origin.
   */
  originY = 0;

  /**
   * Smoothed horizontal transformation.
   */
  dampedX = 0;

  /**
   * Smoothed vertical transformation.
   */
  dampedY = 0;

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
   * The bounds values.
   */
  get bounds() {
    const { target, parent } = this;
    const { offsetTop, offsetHeight, offsetLeft, offsetWidth, offsetParent } = target;
    const yMin = offsetParent === parent ? offsetTop : offsetTop - parent.offsetTop;
    const xMin = offsetParent === parent ? offsetLeft : offsetLeft - parent.offsetLeft;
    const yMax = yMin + offsetHeight - parent.offsetHeight;
    const xMax = xMin + offsetWidth - parent.offsetWidth;

    return {
      yMin,
      yMax,
      xMin,
      xMax,
    };
  }

  /**
   * Drag service hook.
   */
  dragged(props: DragServiceProps) {
    if (props.mode === DragService.MODES.START) {
      this.originX = this.x;
      this.originY = this.y;
      this.dampFactor = this.$options.sensitivity;
      this.render();
    } else if (
      props.mode === DragService.MODES.DRAG ||
      (props.mode === DragService.MODES.INERTIA && !this.$options.fitBounds)
    ) {
      this.x = this.originX + props.x - props.origin.x;
      this.y = this.originY + props.y - props.origin.y;
      this.render();
    } else if (props.mode === DragService.MODES.DROP && this.$options.fitBounds) {
      const { bounds } = this;
      this.x = clamp(this.x, bounds.xMin, bounds.xMax);
      this.y = clamp(this.y, bounds.yMin, bounds.yMax);
      this.dampFactor = this.$options.dropSensitivity;
      this.$services.enable('ticked');
    }
  }

  ticked() {
    this.render();
    if (this.dampedX === this.x && this.dampedY === this.y) {
      this.$services.disable('ticked');
    }
  }

  render() {
    this.dampedX = damp(this.x, this.dampedX, this.dampFactor);
    this.dampedY = damp(this.y, this.dampedY, this.dampFactor);

    domScheduler.write(() => {
      transform(this.target, {
        x: this.dampedX,
        y: this.dampedY,
      });
    });
  }
}
