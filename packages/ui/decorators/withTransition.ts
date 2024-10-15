import { getInstances } from '@studiometa/js-toolkit';
import { transition } from '@studiometa/js-toolkit/utils';
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
     * Trigger the enter transition.
     */
    async enter(target?: HTMLElement | HTMLElement[], { dispatch = true } = {}): Promise<void> {
      const { enterFrom, enterActive, enterTo, enterKeep, leaveTo } = this.$options;

      await Promise.all([
        transition(
          target ?? this.target,
          {
            // eslint-disable-next-line prefer-template
            from: (leaveTo + ' ' + enterFrom).trim(),
            active: enterActive as string,
            to: enterTo as string,
          },
          enterKeep ? 'keep' : undefined,
        ),
        dispatch && this.dispatch('enter'),
      ]);
    }

    /**
     * Trigger the leave transition.
     */
    async leave(target?: HTMLElement | HTMLElement[], { dispatch = true } = {}): Promise<void> {
      const { leaveFrom, leaveActive, leaveTo, leaveKeep, enterTo } = this.$options;

      await Promise.all([
        transition(
          target ?? this.target,
          {
            // eslint-disable-next-line prefer-template
            from: (enterTo + ' ' + leaveFrom).trim(),
            active: leaveActive as string,
            to: leaveTo as string,
          },
          leaveKeep ? 'keep' : undefined,
        ),
        dispatch && this.dispatch('leave'),
      ]);
    }

    /**
     * Dispatch the callback to related instances.
     */
    async dispatch(method: 'enter' | 'leave') {
      const { group } = this.$options;

      if (!group) {
        return;
      }

      const promises = [];

      for (const instance of getInstances(Transition)) {
        if (instance !== this && instance.$options.group === group) {
          promises.push(instance[method](undefined, { dispatch: false }));
        }
      }

      await Promise.all(promises);
    }
  }

  // @ts-ignore
  return Transition;
}
