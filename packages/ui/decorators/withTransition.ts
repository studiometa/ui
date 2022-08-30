import { transition, isArray } from '@studiometa/js-toolkit/utils';
import type { Base, BaseTypeParameter, BaseConstructor, BaseConfig } from '@studiometa/js-toolkit';

/**
 * Manage transition with multiple targets.
 */
function delegateTransition(
  element: HTMLElement | HTMLElement[] | NodeList,
  name: Parameters<typeof transition>[1],
  endMode: Parameters<typeof transition>[2],
): Promise<void | void[]> {
  return isArray(element) || element instanceof NodeList
    ? Promise.all(Array.from(element).map((el: HTMLElement) => transition(el, name, endMode)))
    : transition(element, name, endMode);
}

export interface TransitionInterface extends BaseTypeParameter {
  $options: {
    enterFrom: string;
    enterActive: string;
    enterTo: string;
    enterKeep: boolean;
    leaveFrom: string;
    leaveActive: string;
    leaveTo: string;
    leaveKeep: boolean;
  };
}

/**
 * Extend a class to add transition capabilities.
 */
export default function withTransition<
  S extends BaseConstructor<Base>,
  T extends BaseTypeParameter = BaseTypeParameter,
>(BaseClass: S) {
  class Transition extends BaseClass {
    static config: BaseConfig = {
      name: 'Transition',
      options: {
        enterFrom: String,
        enterActive: String,
        enterTo: String,
        enterKeep: Boolean,
        leaveFrom: String,
        leaveActive: String,
        leaveTo: String,
        leaveKeep: Boolean,
      },
    };

    /**
     * Get the transition target.
     */
    get target(): HTMLElement | HTMLElement[] {
      return this.$el;
    }

    /**
     * Trigger the enter transition.
     */
    enter(target?: HTMLElement | HTMLElement[]): Promise<void | void[]> {
      const { enterFrom, enterActive, enterTo, enterKeep, leaveTo } = this.$options;

      return delegateTransition(
        target ?? this.target,
        {
          // eslint-disable-next-line prefer-template
          from: (leaveTo + ' ' + enterFrom).trim(),
          active: enterActive as string,
          to: enterTo as string,
        },
        enterKeep && 'keep',
      );
    }

    /**
     * Trigger the leave transition.
     */
    leave(target?: HTMLElement | HTMLElement[]): Promise<void | void[]> {
      const { leaveFrom, leaveActive, leaveTo, leaveKeep, enterTo } = this.$options;

      return delegateTransition(
        target ?? this.target,
        {
          // eslint-disable-next-line prefer-template
          from: (enterTo + ' ' + leaveFrom).trim(),
          active: leaveActive as string,
          to: leaveTo as string,
        },
        leaveKeep && 'keep',
      );
    }
  }

  return Transition as BaseConstructor<Transition> &
    Pick<typeof Transition, keyof typeof Transition> &
    S &
    BaseConstructor<Base<T & TransitionInterface>> &
    Pick<typeof Base, keyof typeof Base>;
}
