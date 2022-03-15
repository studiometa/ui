import { Base } from '@studiometa/js-toolkit';
import { scrollTo } from '@studiometa/js-toolkit/utils';

/**
 * @typedef {AnchorScrollTo & {
 *   $el: HTMLAnchorElement
 * }} AnchorScrollToInterface
 */

/**
 * AncorScrollTo class.
 */
export default class AnchorScrollTo extends Base {
  static config = {
    name: 'AnchorScrollTo',
  };

  /**
   * Get the target selector.
   *
   * @this    {AnchorScrollToInterface}
   * @returns {string}
   */
  get targetSelector() {
    return this.$el.hash;
  }

  /**
   * Scroll to the target selector on click.
   *
   * @param   {MouseEvent} event
   * @returns {void}
   */
  onClick(event) {
    try {
      scrollTo(this.targetSelector);
      event.preventDefault();
    } catch (err) {
      // Silence is golden.
    }
  }
}
