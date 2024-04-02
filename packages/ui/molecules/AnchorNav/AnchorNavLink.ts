import type { BaseConfig } from '@studiometa/js-toolkit';
import { AnchorScrollTo } from '../../atoms/AnchorScrollTo/AnchorScrollTo.js';
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
}

// import type { BaseConfig } from '@studiometa/js-toolkit';
// import { AnchorScrollTo, AnchorScrollToProps } from '../../atoms/AnchorScrollTo/AnchorScrollTo.js';
// import { withTransition } from '../../decorators/index.js';
// import { Transition } from '../../primitives/index.js';

// export interface AnchorNavLinkProps extends AnchorScrollToProps {
//   $options: {
//     id: string;
//   };
// }

// /**
//  * Manage a slider item and its state transition.
//  */
// export class AnchorNavLink extends withTransition(AnchorScrollTo)<AnchorNavLinkProps> {
//   /**
//    * Config.
//    */
//   static config: BaseConfig = {
//     ...AnchorScrollTo.config,
//     name: 'AnchorNavLink',
//     options: {
//       ...AnchorScrollTo.config.options,
//       ...Transition.config.options,
//       enterKeep: {
//         type: Boolean,
//         default: true,
//       },
//       leaveKeep: {
//         type: Boolean,
//         default: true,
//       },
//     },
//   };

//   enter() {
//     this.$options.active = true;
//     super.enter();
//   }

//   leave() {
//     this.$options.active = false;
//     super.leave();
//   }
// }
