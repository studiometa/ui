import { Base, withDrag } from '@studiometa/js-toolkit';

/**
 * SliderDrag class.
 */
export default class SliderDrag extends withDrag(Base) {
  /**
   * Config.
   */
  static config = {
    name: 'SliderDrag',
    emits: ['start', 'drag', 'drop', 'inertia', 'stop'],
    sensitivity: {
      type: Number,
      default: 1,
    },
  };

  /**
   * Emit drag events.
   * @param   {import('@studiometa/js-toolkit/services/drag').DragServiceProps} props
   * @returns {void}
   */
  dragged(props) {
    this.$emit(props.mode, props);
  }
}
