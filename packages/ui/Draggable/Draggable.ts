import { Base, withDrag } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig, DragServiceProps } from '@studiometa/js-toolkit';
import { domScheduler, transform } from '@studiometa/js-toolkit/utils';

/**
 * Draggable class.
 */
export class Draggable<T extends BaseProps = BaseProps> extends withDrag(Base)<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
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
  dragged(props: DragServiceProps) {
    if (props.mode === 'start') {
      this.originX = this.x;
      this.originY = this.y;
      return;
    }

    this.x = this.originX + props.x - props.origin.x;
    this.y = this.originY + props.y - props.origin.y;

    domScheduler.write(() => {
      transform(this.$el, {
        x: this.x,
        y: this.y,
      });
    });
  }
}
