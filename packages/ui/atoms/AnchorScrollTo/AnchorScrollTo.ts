import { Base } from '@studiometa/js-toolkit';
import type { BaseTypeParameter, BaseConfig } from '@studiometa/js-toolkit';
import { scrollTo } from '@studiometa/js-toolkit/utils';

export interface AnchorScrollToInterface extends BaseTypeParameter {
  $el: HTMLAnchorElement;
}

/**
 * AncorScrollTo class.
 */
export class AnchorScrollTo<T extends BaseTypeParameter = BaseTypeParameter> extends Base<
  AnchorScrollToInterface & T
> {
  static config: BaseConfig = {
    name: 'AnchorScrollTo',
  };

  /**
   * Get the target selector.
   *
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
    } catch {
      // Silence is golden.
    }
  }
}
