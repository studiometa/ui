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
    options: {
      hashCloak: Boolean,
    },
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
  async onClick(event) {
    const target = document.querySelector(this.targetSelector) as HTMLElement;
    if (!target) {
      return;
    }

    try {
      event.preventDefault();
      await scrollTo(target);

      if (this.$options.hashCloak) {
        return;
      }

      window.location.hash = this.targetSelector;
    } catch {
      // Silence is golden.
    }
  }
}
