import { Base, withDrag } from '@studiometa/js-toolkit';

/**
 * @typedef {SliderDrag & {
 *   $options: {
 *     scrollLockThreshold: number;
 *   }
 * }} SliderDragInterface
 */

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
    options: {
      scrollLockThreshold: {
        type: Number,
        default: 10,
      },
    },
  };

  /**
   * Test if the scroll should be blocked. Used with the touchmove event to prevent
   * scrolling vertically when trying to drag the slider.
   *
   * @this {SliderDragInterface}
   * @returns {boolean}
   */
  get shouldPreventScroll() {
    const { distance } = this.$services.get('dragged');
    return (
      Math.abs(distance.x) > this.$options.scrollLockThreshold &&
      Math.abs(distance.x) > Math.abs(distance.y)
    );
  }

  /**
   * Touchmove handler.
   * @param   {TouchEvent} event
   * @returns {void}
   */
  onTouchmove(event) {
    if (this.shouldPreventScroll) {
      event.preventDefault();
    }
  }

  /**
   * Emit drag events.
   * @param   {import('@studiometa/js-toolkit/services/drag').DragServiceProps} props
   * @returns {void}
   */
  dragged(props) {
    this.$emit(props.mode, props);
  }
}
