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
 */
export function withTransition<S extends Base>(
  BaseClass: typeof Base,
): BaseDecorator<TransitionInterface, S, TransitionProps> {
  /**
   * Class.
   */
  class Transition<T extends BaseProps = BaseProps> extends BaseClass<T & TransitionProps> {
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
  }

  // @ts-ignore
  return Transition;
}
