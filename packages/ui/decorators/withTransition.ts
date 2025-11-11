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
     * Events.
     */
    static EVENTS = {
      TRANSITION_TOGGLE: 'transition-toggle',
      TRANSITION_ENTER: 'transition-enter',
      TRANSITION_ENTER_START: 'transition-enter-start',
      TRANSITION_ENTER_END: 'transition-enter-end',
      TRANSITION_LEAVE: 'transition-leave',
      TRANSITION_LEAVE_START: 'transition-leave-start',
      TRANSITION_LEAVE_END: 'transition-leave-end',
    } as const;

    /**
     * Config.
     */
    static config: BaseConfig = {
      name: 'Transition',
      emits: Object.values(this.EVENTS),
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
      const { STATES, EVENTS } = this.constructor;
      const { enterFrom, enterActive, enterTo, enterKeep, leaveTo } = this.$options;
      this.state = STATES.ENTERING;
      this.$emit(EVENTS.TRANSITION_ENTER);
      this.$emit(EVENTS.TRANSITION_ENTER_START);
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
      this.$emit(EVENTS.TRANSITION_ENTER_END);
    }

    /**
     * Trigger the leave transition.
     */
    async leave(target?: HTMLElement | HTMLElement[]): Promise<void> {
      const { STATES, EVENTS } = this.constructor;
      const { leaveFrom, leaveActive, leaveTo, leaveKeep, enterTo } = this.$options;
      this.state = STATES.LEAVING;
      this.$emit(EVENTS.TRANSITION_LEAVE);
      this.$emit(EVENTS.TRANSITION_LEAVE_START);
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
      this.$emit(EVENTS.TRANSITION_LEAVE_END);
    }

    /**
     * Toggle the leave or enter transition.
     * Defaults to the enter transition if no transition has been triggered yet.
     */
    async toggle(target?: HTMLElement | HTMLElement[]): Promise<void> {
      const { STATES, EVENTS } = this.constructor;

      this.$emit(EVENTS.TRANSITION_TOGGLE);

      switch (this.state) {
        case STATES.ENTERING:
          return this.leave(target);
        case STATES.LEAVING:
        default:
          return this.enter(target);
      }
    }
  }

  // @ts-ignore
  return Transition;
}
