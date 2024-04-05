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
  onAnchorNavTargetMounted(index) {
    const { id } = this.$children.AnchorNavTarget[index].$el;
    this.$children.AnchorNavLink.forEach((anchorNavLink) => {
      if (id === anchorNavLink.targetId) {
        console.log(id, anchorNavLink.targetId, 'enter');
        anchorNavLink.enter();
      }
    });
  }

  /**
   * Listen to the AnchorNavTarget that is destroyed
   */
  onAnchorNavTargetDestroyed(index) {
    const { id } = this.$children.AnchorNavTarget[index].$el;
    this.$children.AnchorNavLink.forEach((anchorNavLink) => {
      if (id === anchorNavLink.targetId) {
        console.log(id, anchorNavLink.targetId, 'destroyed');
        anchorNavLink.leave();
      }
    });
  }
}
