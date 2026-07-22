import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { addClass, removeClass } from '@studiometa/js-toolkit/utils';
import { viewTransition } from './scheduler.js';

export interface ViewTransitionProps extends BaseProps {
  $options: {
    viewTransitionName: string;
    enterTo: string;
    leaveTo: string;
  };
}

/**
 * ViewTransition class.
 *
 * A drop-in alternative to the `Transition` primitive that animates state
 * changes with the native View Transitions API instead of CSS classes. It
 * exposes the same `enter`/`leave`/`toggle` interface, so it can be used
 * anywhere a `Transition` is. The animation itself is authored in CSS via the
 * `::view-transition-old()` / `::view-transition-new()` pseudo-elements.
 *
 * @link https://ui.studiometa.dev/components/ViewTransition/
 */
export class ViewTransition<T extends BaseProps = BaseProps> extends Base<T & ViewTransitionProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'ViewTransition',
    emits: ['enter', 'enter-start', 'enter-end', 'leave', 'leave-start', 'leave-end', 'toggle'],
    options: {
      viewTransitionName: String,
      enterTo: String,
      leaveTo: String,
    },
  };

  /**
   * Current state.
   */
  state: 'entering' | 'leaving' | null = null;

  /**
   * Get the transition target.
   */
  get target(): HTMLElement {
    return this.$el;
  }

  /**
   * Assign the configured `view-transition-name` to the target element.
   */
  mounted() {
    const { viewTransitionName } = this.$options;
    if (viewTransitionName) {
      this.target.style.setProperty('view-transition-name', viewTransitionName);
    }
  }

  /**
   * Trigger the enter transition.
   */
  async enter(): Promise<void> {
    this.state = 'entering';
    this.$emit('enter');
    this.$emit('enter-start');
    await viewTransition(() => {
      removeClass(this.target, this.$options.leaveTo);
      addClass(this.target, this.$options.enterTo);
    });
    this.$emit('enter-end');
  }

  /**
   * Trigger the leave transition.
   */
  async leave(): Promise<void> {
    this.state = 'leaving';
    this.$emit('leave');
    this.$emit('leave-start');
    await viewTransition(() => {
      removeClass(this.target, this.$options.enterTo);
      addClass(this.target, this.$options.leaveTo);
    });
    this.$emit('leave-end');
  }

  /**
   * Toggle between the enter and leave transitions.
   * Defaults to the enter transition if no transition has been triggered yet.
   */
  toggle(): Promise<void> {
    return this.state === 'entering' ? this.leave() : this.enter();
  }
}
