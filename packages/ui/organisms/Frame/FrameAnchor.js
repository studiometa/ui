import { Base } from '@studiometa/js-toolkit';

/**
 * FrameAnchor class.
 */
export default class FrameAnchor extends Base {
  static config = {
    name: 'FrameAnchor',
    emits: ['frame-click'],
  };

  get href() {
    return this.$el.href;
  }

  onClick(event) {
    this.$emit('frame-click', event);
  }
}
