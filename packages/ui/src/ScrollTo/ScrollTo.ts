import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { scrollTo } from '@studiometa/js-toolkit/utils/scrollTo';

export type ScrollToProps = BaseProps & { $el: HTMLAnchorElement };

/**
 * Enhances an anchor so that clicking it smoothly scrolls to the element its
 * `href` hash points to, instead of jumping. Renamed from `AnchorScrollTo`.
 *
 * @link https://ui.studiometa.dev/reference/items/ScrollTo/
 */
export class ScrollTo<T extends BaseProps = BaseProps> extends Base<ScrollToProps & T> {
  static config: BaseConfig = { name: 'ScrollTo' };

  /** The target selector, read from the link's hash. */
  get targetSelector(): string {
    return this.$el.hash;
  }

  /**
   * `scrollTo()` is a silent no-op on a target the document does not contain,
   * so the existence check has to happen here: `preventDefault()` runs only
   * once a target is confirmed, and the link keeps its native behaviour
   * otherwise.
   */
  onClick(event: MouseEvent): void {
    const { targetSelector } = this;
    const target = targetSelector ? document.querySelector(targetSelector) : null;

    if (!target) {
      return;
    }

    event.preventDefault();
    scrollTo(target);
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/ScrollTo`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default ScrollTo;
