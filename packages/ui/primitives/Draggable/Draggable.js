import { Base, withDrag } from '@studiometa/js-toolkit';
import { matrix } from '@studiometa/js-toolkit/utils';

/**
 * Draggable class.
 */
export default class Draggable extends withDrag(Base) {
  static config = {
    name: 'DraggableElement',
  };

  /**
   * Horizontal transformation.
   * @type {number}
   */
  x = 0;

  /**
   * Vertical transformation.
   * @type {number}
   */
  y = 0;

  /**
   * Horizontal position origin.
   * @type {number}
   */
  originX = 0;

  /**
   * Vertical position origin.
   * @type {number}
   */
  originY = 0;

  /**
   * Drag service hook.
   * @param {import('@studiometa/js-toolkit/services/drag.js').DragServiceProps} props
   */
  dragged(props) {
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
