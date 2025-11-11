import { getInstances } from '@studiometa/js-toolkit';
import { nextFrame, removeClass, transition } from '@studiometa/js-toolkit/utils';
import type {
  Base,
  BaseDecorator,
  BaseProps,
  BaseConfig,
  BaseInterface,
} from '@studiometa/js-toolkit';

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
    group: string;
  };
}

export interface TransitionInterface extends BaseInterface {
  /**
   * Get the transition target.
   */
  get target(): HTMLElement | HTMLElement[];
  /**
   * Get the group targets.
   */
  get targets(): HTMLElement[];
  /**
   * Trigger the enter transition.
   */
  enter(target?: HTMLElement | HTMLElement[]): Promise<void>;
  /**
   * Trigger the leave transition.
   */
  leave(target?: HTMLElement | HTMLElement[]): Promise<void>;
}

/**
 * Extend a class to add transition capabilities.
 * @link https://ui.studiometa.dev/components/Transition/
 */
export function withTransition<S extends Base>(
  BaseClass: typeof Base,
): BaseDecorator<TransitionInterface, S, TransitionProps> {
  type TransitionConstructor<T extends Transition = Transition> = {
    new (...args: any[]): T;
    prototype: Transition;
  } & Pick<typeof Transition, keyof typeof Transition>;

  /**
   * Class.
   */
  class Transition<T extends BaseProps = BaseProps> extends BaseClass<T & TransitionProps> {
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
      options: {
        enterFrom: String,
        enterActive: String,
        enterTo: String,
        enterKeep: Boolean,
        leaveFrom: String,
        leaveActive: String,
        leaveTo: String,
        leaveKeep: Boolean,
        group: String,
      },
    };

    /**
     * States.
     */
    static STATES = {
      ENTERING: 'entering',
      LEAVING: 'leaving',
    } as const;

    /**
     * Current state.
     */
    state: 'entering' | 'leaving' = null;

    /**
     * Get the transition target.
     */
    get target(): HTMLElement | HTMLElement[] {
      return this.$el;
    }

    /**
     * Get the group targets.
     */
    get targets(): HTMLElement[] {
      const { group } = this.$options;
      const targets = [this.target];

      if (group) {
        for (const instance of getInstances(this.constructor as typeof Transition)) {
          if (instance !== this && instance.$options.group === group) {
            targets.push(instance.target);
          }
        }
      }

      return targets.flat();
    }

    /**
     * Trigger the enter transition.
     */
    async enter(target?: HTMLElement | HTMLElement[]): Promise<void> {
      const { enterFrom, enterActive, enterTo, enterKeep, leaveTo } = this.$options;
      this.state = this.constructor.STATES.ENTERING;
      removeClass(target ?? this.targets, leaveTo);
      await nextFrame();
      await transition(
        target ?? this.targets,
        {
          from: enterFrom,
          active: enterActive as string,
          to: enterTo as string,
        },
        enterKeep ? 'keep' : undefined,
      );
    }

    /**
     * Trigger the leave transition.
     */
    async leave(target?: HTMLElement | HTMLElement[]): Promise<void> {
      const { leaveFrom, leaveActive, leaveTo, leaveKeep, enterTo } = this.$options;
      this.state = this.constructor.STATES.LEAVING;
      removeClass(target ?? this.targets, enterTo);
      await nextFrame();
      await transition(
        target ?? this.targets,
        {
          from: leaveFrom,
          active: leaveActive as string,
          to: leaveTo as string,
        },
        leaveKeep ? 'keep' : undefined,
      );
    }

    /**
     * Toggle the leave or enter transition.
     * Defaults to the enter transition if no transition has been triggered yet.
     */
    async toggle(target?: HTMLElement | HTMLElement[]): Promise<void> {
      const { STATES: STATUSES } = this.constructor;

      switch (this.state) {
        case STATUSES.ENTERING:
          return this.leave(target);
        case STATUSES.LEAVING:
        default:
          return this.enter(target);
      }
    }
  }

  // @ts-ignore
  return Transition;
}
