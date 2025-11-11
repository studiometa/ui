import { Base, BaseProps } from '@studiometa/js-toolkit';
import type { BaseConfig } from '@studiometa/js-toolkit';
import { withTransition } from '../decorators/index.js';

export type TransitionConstructor<T extends Transition = Transition> = {
  new (...args: any[]): T;
  prototype: Transition;
  EVENTS: {
    TRANSITION_TOGGLE: 'transition-toggle';
    TRANSITION_ENTER: 'transition-enter';
    TRANSITION_ENTER_START: 'transition-enter-start';
    TRANSITION_ENTER_END: 'transition-enter-end';
    TRANSITION_LEAVE: 'transition-leave';
    TRANSITION_LEAVE_START: 'transition-leave-start';
    TRANSITION_LEAVE_END: 'transition-leave-end';
  };

  STATES: {
    ENTERING: 'entering';
    LEAVING: 'leaving';
  };
} & Pick<typeof Transition, keyof typeof Transition>;

/**
 * Transition class.
 * @link https://ui.studiometa.dev/components/Transition/
 */
export class Transition<T extends BaseProps = BaseProps> extends withTransition<Base>(Base)<T> {
  /**
   * Declare the `this.constructor` type
   * @link https://github.com/microsoft/TypeScript/issues/3841#issuecomment-2381594311
   */
  declare ['constructor']: TransitionConstructor;

  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Transition',
  };
}
