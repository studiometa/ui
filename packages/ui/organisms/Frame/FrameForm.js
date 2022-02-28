import { Base } from '@studiometa/js-toolkit';

/**
 * FrameForm class.
 */
export default class FrameForm extends Base {
  static config = {
    name: 'FrameForm',
    emits: ['frame-submit'],
  };

  get action() {
    return this.$el.action;
  }

  onSubmit(event) {
    this.$emit('frame-submit', event);
  }
}
