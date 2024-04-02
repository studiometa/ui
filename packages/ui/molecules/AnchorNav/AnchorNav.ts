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
    console.log(id);

    if (document.querySelector('.current')) {
      document.querySelector('.current').classList.remove('current');
    }
    const currentAnchorNavLink = this.$children.AnchorNavLink.find(
      (anchorNavLink) => anchorNavLink.targetSelector === id,
    );
    currentAnchorNavLink.$el.classList.add('current');
  }

  //   this.$children.AnchorNavLink.filter((navLink, navLinkId) => id !== navLinkId).forEach(
  //     ({ leave }) => leave(),
  //   );

  //   this.$children.AnchorNavLink[id].enter();
  // }
}
