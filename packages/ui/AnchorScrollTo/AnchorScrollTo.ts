import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { scrollTo } from '@studiometa/js-toolkit/utils';

export interface AnchorScrollToProps extends BaseProps {
  $el: HTMLAnchorElement;
}

/**
 * AnchorScrollTo class.
 * @link https://ui.studiometa.dev/-/components/AnchorScrollto/
 */
export class AnchorScrollTo<T extends BaseProps = BaseProps> extends Base<AnchorScrollToProps & T> {
  static config: BaseConfig = {
    name: 'AnchorScrollTo',
  };

  /**
   * Get the target selector.
   */
  get targetSelector(): Parameters<typeof scrollTo>[0] {
    return this.$el.hash;
  }

  /**
   * Scroll to the target selector on click.
   */
  onClick({ event }: { event: MouseEvent }) {
    try {
      scrollTo(this.targetSelector);
      event.preventDefault();
    } catch {
      // Silence is golden.
    }
  }
}
