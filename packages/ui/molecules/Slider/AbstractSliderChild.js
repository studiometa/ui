import { Base } from '@studiometa/js-toolkit';
import { nextFrame } from '@studiometa/js-toolkit/utils';
import Slider from './Slider.js';

/**
 * @typedef {AbstractSliderChild & { $parent: Slider, $refs: { progress: HTMLElement } }} AbstractSliderChildInterface
 */

/**
 * AbstractSliderChild class.
 */
export default class AbstractSliderChild extends Base {
  /**
   * Config.
   */
  static config = {
    name: 'AbstractSliderChild',
  };

  /**
   * @type {Slider}
   */
  // @ts-ignore
  $parent;

  /**
   * Listen to the `goto` event of the parent on mount.
   * @returns {void}
   */
  mounted() {
    if (!(this.$parent instanceof Slider)) {
      throw new Error(
        `The \`${this.$options.name}\` component must be a direct child of a \`Slider\` component.`
      );
    }

    this.$parent.$on('index', this);
  }

  /**
   * Trigger update on resize.
   *
   * @this    {AbstractSliderChildInterface}
   * @returns {void}
   */
  resized() {
    nextFrame(() => {
      this.update(this.$parent.currentIndex);
    });
  }

  /**
   * Remove the event listener.
   *
   * @returns {void}
   */
  destroyed() {
    this.$parent.$off('index', this);
  }

  /**
   * Dispatch event.
   *
   * @param   {CustomEvent} event
   * @returns {void}
   */
  handleEvent(event) {
    if (event.type === 'index') {
      this.update(event.detail[0]);
    }
  }

  /**
   * Update the child component with the given index.
   *
   * @this    {AbstractSliderChildInterface}
   * @param   {number} index The new active index.
   * @returns {void}
   */
  update(index) {
    throw new Error(`The \`AbstractSliderChild.update(${index})\` method must be implemented.`);
  }
}
