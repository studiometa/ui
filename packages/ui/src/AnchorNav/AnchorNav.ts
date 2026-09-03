import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps, ChildrenCollection } from '@studiometa/js-toolkit';
import { AnchorNavLink } from './AnchorNavLink.js';
import { AnchorNavTarget } from './AnchorNavTarget.js';

export type AnchorNavProps = BaseProps;

/**
 * Coordinates `AnchorNavLink` children with their matching `AnchorNavTarget`
 * sections. The pairing is driven from `$watchChildren`'s `added`/`removed`
 * callbacks, which fire exactly on a matching child's mount and unmount.
 *
 * @link https://ui.studiometa.dev/reference/items/AnchorNav/
 */
export class AnchorNav<T extends BaseProps = BaseProps> extends Base<AnchorNavProps & T> {
  static config: BaseConfig = {
    name: 'AnchorNav',
    components: { AnchorNavLink, AnchorNavTarget },
  };

  links: ChildrenCollection<AnchorNavLink> = this.$watchChildren<AnchorNavLink>('AnchorNavLink');

  targets: ChildrenCollection<AnchorNavTarget> = this.$watchChildren<AnchorNavTarget>(
    'AnchorNavTarget',
    {
      added: (target) => this.__toggleLinksFor(target, 'enter'),
      removed: (target) => this.__toggleLinksFor(target, 'leave'),
    },
  );

  /** @private */
  __toggleLinksFor(target: AnchorNavTarget, action: 'enter' | 'leave'): void {
    const { id } = target.$el;
    for (const link of this.links) {
      if (link.targetId === id) {
        void link[action]();
      }
    }
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/AnchorNav`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default AnchorNav;
