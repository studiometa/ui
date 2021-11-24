import { animate } from 'motion';
import { Base, withDrag } from '@studiometa/js-toolkit';

/**
 * Draggable class.
 */
export default class Draggable extends withDrag(Base) {
  static config = {
    name: 'DraggableElement',
  };

  /**
   * Options for the animate function.
   * @type {import('motion').AnimationListOptions}
   */
  static animateOptions = {
    easing: 'linear',
    duration: 0,
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

    animate(this.$el, { x: this.x, y: this.y }, Draggable.animateOptions);
  }
}
