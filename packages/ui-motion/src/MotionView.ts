import { Base } from '@studiometa/js-toolkit/Base';
import { EVENTS } from '@studiometa/js-toolkit/EVENTS';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
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
    auto: boolean;
  };
  /**
   * The transition lifecycle. The names mirror `ViewTransition`'s, which is
   * what makes the two interchangeable.
   */
  $emits: {
    enter: void;
    'enter-start': void;
    'enter-end': void;
    leave: void;
    'leave-start': void;
    'leave-end': void;
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
 * Containment is the wiring: with the `auto` option (on by default), the
 * component wraps any DOM update announced by a mutating component inside its
 * subtree, and joins the open/close lifecycle of a containing `Dialog` through
 * the extendable events' `waitUntil()`. Explicit `Action` wiring
 * (`event.detail.wrap(target)`) remains for cross-subtree topologies.
 *
 * @example
 * ```html
 * <div data-component="MotionView" data-option-enter-to="is-open" data-option-transition='{ "type": "spring", "bounce": 0.3 }'>
 *   Content
 * </div>
 * <button data-component="Action" data-on:click="MotionView->target.toggle()">Toggle</button>
 * ```
 *
 * @link https://ui.studiometa.dev/reference/items/MotionView/
 */
export class MotionView<T extends BaseProps = BaseProps> extends Base<MotionViewProps & T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MotionView',
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
      auto: {
        type: Boolean,
        default: true,
      },
    },
  };

  /**
   * Current state.
   */
  state: 'entering' | 'leaving' | null = null;

  /**
   * Wrap an `EVENTS.dom.update` announced by a mutating component inside the
   * subtree: the bubbling event reaches the root element, and passing the
   * instance to `detail.wrap()` lets the emitter run its mutation through
   * `update()` — the duck-typed method `domUpdate()` looks for is `update`,
   * which this component already owns.
   * @private
   */
  __onDomUpdate = (event: Event) => {
    const { wrap } = (event as CustomEvent).detail ?? {};
    if (typeof wrap === 'function') {
      wrap(this);
    }
  };

  /**
   * Join the open/close lifecycle of a containing `Dialog`: its extendable
   * events bubble up past the root element to the document, and registering
   * with `detail.waitUntil()` holds the dialog's choreography open until this
   * component's transition settles.
   *
   * Registered as a **function**, not as `this`. `emitExtendable()` duck-types
   * an object registration on the name of the event — it would look for
   * `open()` and `close()`, which a transition component has no business
   * owning. The function form is what the primitive documents for a pair of
   * method names that differ from the event names, and it maps `open` onto
   * `enter()` and `close` onto `leave()` explicitly.
   * @private
   */
  __onDialogPhase = (event: Event) => {
    const { target } = event;
    const { waitUntil } = (event as CustomEvent).detail ?? {};
    if (
      target instanceof Element &&
      target !== this.$el &&
      target.contains(this.$el) &&
      typeof waitUntil === 'function'
    ) {
      waitUntil(event.type === 'open' ? () => this.enter() : () => this.leave());
    }
  };

  /**
   * Get the transition target.
   */
  get target(): HTMLElement {
    return this.$el;
  }

  /**
   * Assign the configured `view-transition-name` to the target element and,
   * with the `auto` option, listen for ambient wiring events:
   * `EVENTS.dom.update` from descendant mutators on the root element, and the
   * extendable `open`/`close` events of a containing `Dialog` on the document.
   */
  mounted() {
    const { viewTransitionName, auto } = this.$options;
    if (viewTransitionName) {
      this.target.style.setProperty('view-transition-name', viewTransitionName);
    }

    if (!auto) {
      return;
    }

    this.$el.addEventListener(EVENTS.dom.update, this.__onDomUpdate);
    document.addEventListener('open', this.__onDialogPhase);
    document.addEventListener('close', this.__onDialogPhase);

    // Returning the teardown keeps it paired with the `auto` branch that
    // installed it.
    return () => {
      this.$el.removeEventListener(EVENTS.dom.update, this.__onDomUpdate);
      document.removeEventListener('open', this.__onDialogPhase);
      document.removeEventListener('close', this.__onDialogPhase);
    };
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
        'motion-view.missing-animate-view',
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
      this.__toggleClasses(this.$options.leaveTo, this.$options.enterTo);
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
      this.__toggleClasses(this.$options.enterTo, this.$options.leaveTo);
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

  /**
   * Swap one space separated class list for another on the target, the way
   * `ViewTransition` does it.
   * @private
   */
  __toggleClasses(remove: string, add: string): void {
    const removed = remove.split(' ').filter(Boolean);
    const added = add.split(' ').filter(Boolean);

    if (removed.length > 0) {
      this.target.classList.remove(...removed);
    }

    if (added.length > 0) {
      this.target.classList.add(...added);
    }
  }
}

export default MotionView;
