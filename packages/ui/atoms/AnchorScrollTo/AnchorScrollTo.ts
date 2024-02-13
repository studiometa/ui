import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { scrollTo } from '@studiometa/js-toolkit/utils';

export interface AnchorScrollToProps extends BaseProps {
  $el: HTMLAnchorElement;
}

/**
 * AncorScrollTo class.
 */
export class AnchorScrollTo<T extends BaseProps = BaseProps> extends Base<AnchorScrollToProps & T> {
  static config: BaseConfig = {
    name: 'AnchorScrollTo',
  };

  /**
   * Get the target selector.
   * @returns {string}
   */
  get targetSelector() {
    return this.$el.hash;
  }

  /**
   * Scroll to the target selector on click.
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
