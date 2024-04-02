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
   * Listen to the AnchorNavTarget that is intersected
   */
  onAnchorNavTargetIsIntersected(id) {
    this.$children.AnchorNavLink.forEach((item) => {
      const method = item.targetSelector === id ? 'enter' : 'leave';
      item[method]();
    });
  }
}
