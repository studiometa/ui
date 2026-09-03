import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { ScrollTo } from '../ScrollTo/index.js';
import { withTransition, type TransitionProps } from '../decorators/withTransition.js';

export type AnchorNavLinkProps = BaseProps & TransitionProps;

/**
 * A `ScrollTo` link that also enters/leaves a CSS transition on itself,
 * driven by `AnchorNav` as its matching `AnchorNavTarget` mounts and
 * unmounts.
 *
 * `withTransition(ScrollTo)` is why the behaviour is a mixin rather than a
 * component: the transition belongs on a class that already extends something
 * else.
 *
 * @link https://ui.studiometa.dev/reference/items/AnchorNav/
 */
export class AnchorNavLink<T extends BaseProps = BaseProps> extends withTransition(ScrollTo)<
  AnchorNavLinkProps & T
> {
  static config: BaseConfig = {
    name: 'AnchorNavLink',
  };

  /** The target section id, read from the link's hash. */
  get targetId(): string {
    return this.$el.hash.replace(/^#/, '');
  }
}
