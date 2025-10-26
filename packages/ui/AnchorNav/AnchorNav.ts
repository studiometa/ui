import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { AnchorNavLink } from './AnchorNavLink.js';
import { AnchorNavTarget } from './AnchorNavTarget.js';

export interface AnchorNavProps extends BaseProps {
  $children: {
    AnchorNavLink: AnchorNavLink[];
    AnchorNavTarget: AnchorNavTarget[];
  };
}

/**
 * AnchorNav class.
 * @link https://ui.studiometa.dev/-/components/AnchorNav/
 */
export class AnchorNav<T extends BaseProps = BaseProps> extends Base<T & AnchorNavProps> {
  /**
   * Config
   */
  static config: BaseConfig = {
    name: 'AnchorNav',
    components: {
      AnchorNavLink,
      AnchorNavTarget,
    },
  };

  /**
   * Listen to the AnchorNavTarget that is mounted
   */
  onAnchorNavTargetMounted({ target }: { target: AnchorNavTarget }) {
    const { id } = target.$el;
    this.$children.AnchorNavLink.forEach((anchorNavLink) => {
      if (id === anchorNavLink.targetId) {
        anchorNavLink.enter();
      }
    });
  }

  /**
   * Listen to the AnchorNavTarget that is destroyed
   */
  onAnchorNavTargetDestroyed({ target }: { target: AnchorNavTarget }) {
    const { id } = target.$el;
    this.$children.AnchorNavLink.forEach((anchorNavLink) => {
      if (id === anchorNavLink.targetId) {
        anchorNavLink.leave();
      }
    });
  }
}
