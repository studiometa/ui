import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { addClass } from '@studiometa/js-toolkit/utils/addClass';
import { removeClass } from '@studiometa/js-toolkit/utils/removeClass';
import type { animateView, DOMKeyframesDefinition } from 'motion';
import { resolveMotion } from './dependencies.js';

type ViewTransitionOptions = NonNullable<Parameters<typeof animateView>[1]>;

export interface MotionViewProps extends BaseProps {
  $options: {
    viewTransitionName: string;
    enterTo: string;
    leaveTo: string;
    transition: ViewTransitionOptions;
    add: string;
    new: DOMKeyframesDefinition;
    old: DOMKeyframesDefinition;
    enter: DOMKeyframesDefinition;
    exit: DOMKeyframesDefinition;
    layout: boolean;
  };
}

/**
 * MotionView class.
 *
 * Wrap DOM updates in Motion's [`animateView()`](https://motion.dev/docs/animate-view)
 * so the mutation plays as a view transition. A drop-in alternative to the
 * `ViewTransition` component — same `enter()`/`leave()`/`toggle()` surface,
 * `state` property and options — but the animation is declared with Motion
 * keyframes and transitions (including springs) instead of CSS
 * pseudo-elements. The `update()` method is the underlying primitive: hand it
 * any mutation and it animates.
 *
 * The mutation is never lost: without browser support the update applies
 * without animation, and `animateView()` is not part of `motion/mini` — the
 * component then warns and applies updates directly.
 *
 * @example
 * ```html
 * <div data-component="MotionView" data-option-enter-to="is-open" data-option-transition='{ "type": "spring", "bounce": 0.3 }'>
 *   Content
 * </div>
 * <button data-component="Action" data-on:click="MotionView->target.toggle()">Toggle</button>
 * ```
 *
 * @link https://ui.studiometa.dev/reference/items/Motion/js-api#motionview
 */
export class MotionView<T extends BaseProps = BaseProps> extends Base<MotionViewProps & T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MotionView',
    emits: ['enter', 'enter-start', 'enter-end', 'leave', 'leave-start', 'leave-end', 'toggle'],
    options: {
      viewTransitionName: String,
      enterTo: String,
      leaveTo: String,
      transition: Object,
      add: String,
      new: Object,
      old: Object,
      enter: Object,
      exit: Object,
      layout: Boolean,
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
   * Run the given mutation as a view transition built from the options: the
   * `add` selector picks the animated subjects within the root element (the
   * element itself by default), the `new`, `old`, `enter` and `exit` keyframes
   * apply to each subject's layers, and `layout` enables the morph transition.
   * The returned promise resolves when the animation settles and never
   * rejects; when the animation cannot run, the mutation still applies.
   */
  async update(mutate: () => void | Promise<void>): Promise<void> {
    const motion = await resolveMotion();

    if (!motion.animateView) {
      this.$warn(
        'The resolved motion module has no `animateView()` (e.g. `motion/mini`). Provide the full `motion` entry to animate updates with MotionView.',
      );
      await mutate();
      return;
    }

    const {
      transition,
      add,
      new: newKeyframes,
      old: oldKeyframes,
      enter: enterKeyframes,
      exit: exitKeyframes,
      layout,
    } = this.$options;

    const builder = motion.animateView(
      mutate,
      Object.keys(transition).length > 0 ? transition : undefined,
    );

    const targets: Element[] = add ? Array.from(this.$el.querySelectorAll(add)) : [this.$el];
    for (const target of targets) {
      builder.add(target);
      if (Object.keys(newKeyframes).length > 0) {
        builder.new(newKeyframes);
      }
      if (Object.keys(oldKeyframes).length > 0) {
        builder.old(oldKeyframes);
      }
      if (Object.keys(enterKeyframes).length > 0) {
        builder.enter(enterKeyframes);
      }
      if (Object.keys(exitKeyframes).length > 0) {
        builder.exit(exitKeyframes);
      }
      if (layout) {
        builder.layout();
      }
    }

    // Browsers without the View Transitions API may reject or settle early:
    // the mutation has already run, so degrade silently instead of throwing.
    try {
      const animation = (await builder) as { finished: Promise<unknown> };
      await animation.finished;
    } catch {
      // Graceful degradation: the update ran, only the animation could not.
    }
  }

  /**
   * Trigger the enter transition.
   */
  async enter(): Promise<void> {
    this.state = 'entering';
    this.$emit('enter');
    this.$emit('enter-start');
    await this.update(() => {
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
    await this.update(() => {
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

export default MotionView;
