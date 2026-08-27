import { Base, component, type BaseProps, type ChildrenCollection } from '@studiometa/js-toolkit';
import { AnchorNavLink } from './AnchorNavLink.js';
import { AnchorNavTarget } from './AnchorNavTarget.js';

export type AnchorNavProps = BaseProps;

/**
 * Coordinates `AnchorNavLink` children with their matching `AnchorNavTarget`
 * sections. v3 reacted to the target's `mounted`/`destroyed` lifecycle events
 * bubbling with their plain names; v4 dispatches those under a namespaced
 * event type instead (`js-toolkit:component:mounted`), so magic-name
 * delegation (`onAnchorNavTargetMounted`) cannot bind to them directly.
 * `$watchChildren`'s `added`/`removed` callbacks answer the same question —
 * they already fire exactly on a matching child's mount/unmount transitions.
 *
 * @link https://ui.studiometa.dev/reference/items/AnchorNav/
 */
@component({
  name: 'AnchorNav',
  components: { AnchorNavLink, AnchorNavTarget },
})
export class AnchorNav<T extends BaseProps = BaseProps> extends Base<AnchorNavProps & T> {
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
