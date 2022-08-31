import { Base, DragServiceProps, withDrag } from '@studiometa/js-toolkit';
import type { BaseConfig } from '@studiometa/js-toolkit';
import { matrix } from '@studiometa/js-toolkit/utils';

/**
 * Draggable class.
 */
export class Draggable extends withDrag(Base) {
  static config = {
    name: 'DraggableElement',
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
   * Drag service hook.
   */
  dragged(props:DragServiceProps) {
    if (props.mode === 'start') {
      this.originX = this.x;
      this.originY = this.y;
      return;
    }

    this.x = this.originX + props.x - props.origin.x;
    this.y = this.originY + props.y - props.origin.y;

    this.$el.style.transform = matrix({ translateX: this.x, translateY: this.y });
  }
}
