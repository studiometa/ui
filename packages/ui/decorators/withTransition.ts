import { transition, isArray } from '@studiometa/js-toolkit/utils';
import type {
  Base,
  BaseDecorator,
  BaseProps,
  BaseConfig,
  BaseInterface,
} from '@studiometa/js-toolkit';

/**
 * Manage transition with multiple targets.
 */
function delegateTransition<
  V extends HTMLElement | HTMLElement[] | NodeList,
  W = V extends HTMLElement ? Promise<void> : Promise<void[]>,
>(
  elementOrElements: V,
  name: Parameters<typeof transition>[1],
  endMode?: Parameters<typeof transition>[2],
): W {
  // @ts-ignore
  return isArray(elementOrElements) || elementOrElements instanceof NodeList
    ? (Promise.all(
        Array.from(elementOrElements).map((el: HTMLElement) => transition(el, name, endMode)),
      ) as Promise<void[]>)
    : (transition(elementOrElements, name, endMode) as Promise<void>);
}

export interface TransitionProps extends BaseProps {
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

export interface TransitionInterface extends BaseInterface {
  /**
   * Get the transition target.
   */
  get target(): HTMLElement | HTMLElement[];
  /**
   * Trigger the enter transition.
   */
  enter(target?: HTMLElement | HTMLElement[]):Promise<void>;
  /**
   * Trigger the leave transition.
   */
  leave(target?: HTMLElement | HTMLElement[]):Promise<void>;
}

/**
 * Extend a class to add transition capabilities.
 */
export function withTransition<S extends Base>(
  BaseClass: typeof Base,
): BaseDecorator<TransitionInterface, S, TransitionProps> {
  /**
   * Class.
   */
  class Transition<T extends BaseProps = BaseProps> extends BaseClass<
    T & TransitionProps
  > {
    /**
     * Config.
     */
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
    async enter(target?: HTMLElement | HTMLElement[]): Promise<void> {
      const { enterFrom, enterActive, enterTo, enterKeep, leaveTo } = this.$options;

      await delegateTransition(
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
    async leave(target?: HTMLElement | HTMLElement[]): Promise<void> {
      const { leaveFrom, leaveActive, leaveTo, leaveKeep, enterTo } = this.$options;

      await delegateTransition(
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

  // @ts-ignore
  return Transition;
}
