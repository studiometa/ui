import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { scrollTo } from '@studiometa/js-toolkit/utils';

export interface AnchorScrollToProps extends BaseProps {
  $el: HTMLAnchorElement;
}

/**
 * AnchorScrollTo class.
 *
 * Enhances an anchor element so that clicking it smoothly scrolls to the element
 * referenced by its `href` hash instead of jumping. It reads the target from the
 * link's `hash`, delegates the animation to the toolkit `scrollTo` helper and
 * prevents the default jump; if the target cannot be resolved the click is left
 * untouched.
 *
 * @link https://ui.studiometa.dev/components/AnchorScrollto/
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
