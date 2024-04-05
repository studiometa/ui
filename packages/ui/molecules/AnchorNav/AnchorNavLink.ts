import type { BaseConfig } from '@studiometa/js-toolkit';
import { AnchorScrollTo, AnchorScrollToProps } from '../../atoms/AnchorScrollTo/AnchorScrollTo.js';
import { withTransition } from '../../decorators/index.js';

export interface AnchorNavLinkProps extends AnchorScrollToProps {
  $options: {
    id: string;
  };
}

/**
 * Manage a slider item and its state transition.
 */
export class AnchorNavLink extends withTransition(AnchorScrollTo)<AnchorNavLinkProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AnchorScrollTo.config,
    name: 'AnchorNavLink',
  };

  get targetId() {
    return this.$el.hash.replace(/^#/, '');
  }
}
