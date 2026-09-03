import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import type {
  AnimationOptions,
  AnimationPlaybackControlsWithThen,
  DOMKeyframesDefinition,
} from 'motion';
import { getMotion, resolveMotion } from './dependencies.js';
import type { MotionModule } from './dependencies.js';

export interface MotionProps extends BaseProps {
  $options: {
    initial: DOMKeyframesDefinition;
    animate: DOMKeyframesDefinition;
    transition: AnimationOptions;
    autoplay: boolean;
    at: string;
    hover: DOMKeyframesDefinition;
    press: DOMKeyframesDefinition;
    inView: DOMKeyframesDefinition;
    inViewMargin: string;
    inViewAmount: string;
    once: boolean;
  };
  /**
   * The playback lifecycle. None of these events carries a payload — a listener
   * that needs the animation reads it from the component.
   */
  $emits: {
    'motion-play': void;
    'motion-pause': void;
    'motion-complete': void;
    'motion-cancel': void;
    'motion-stop': void;
  };
}

/**
 * Motion class.
 *
 * Animate the component's root element declaratively with the
 * [Motion](https://motion.dev) library. The `initial` styles are applied on
 * mount, then the `animate` keyframes play when playback on mount is enabled
 * with `data-option-autoplay`.
 *
 * The component holds a single current animation. `play()` and `reverse()`
 * always drive the animation declared by the options — recreating it when an
 * imperative {@link Motion.animate} call superseded it — while the other
 * playback methods (`pause`, `seek`, `stop`, ...) act on whichever animation
 * is current. An `Action` can control it from any interaction:
 * `data-on:click="Motion->target.play()"`.
 *
 * Events bubble, so an ancestor `Action` can catch and route them; use the
 * `.stop` event modifier to contain them in nested setups.
 *
 * @link https://ui.studiometa.dev/reference/items/Motion/
 */
export class Motion<T extends BaseProps = BaseProps> extends Base<MotionProps & T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Motion',
    options: {
      initial: Object,
      animate: Object,
      transition: Object,
      autoplay: Boolean,
      at: String,
      hover: Object,
      press: Object,
      inView: Object,
      inViewMargin: String,
      inViewAmount: String,
      once: Boolean,
    },
  };

  /**
   * The current animation playback controls, or `null` when idle.
   * @private
   */
  __controls: AnimationPlaybackControlsWithThen | null = null;

  /**
   * Monotonic token invalidating stale completion watchers whenever the
   * current playback changes (new play, stop, cancel, destroy).
   * @private
   */
  __completionToken = 0;

  /**
   * The stop function of each gesture binding, released on destroy.
   * @private
   */
  __gestureStops: VoidFunction[] = [];

  /**
   * The base value of every property a gesture animated, captured the first
   * time a gesture touched it — the values a gesture returns to when it ends.
   * @private
   */
  __baseValues: Record<string, string | number> = {};

  /**
   * Whether the current animation was built from the `animate` and
   * `transition` options, as opposed to an imperative `animate()` call.
   * @private
   */
  __fromOptions = false;

  /**
   * The current animation playback controls, exposed for advanced use from
   * `Action` effects (e.g. `Motion->target.controls.speed = 2`).
   */
  get controls(): AnimationPlaybackControlsWithThen | null {
    return this.__controls;
  }

  /**
   * The current playback time in seconds.
   */
  get time(): number {
    return this.__controls?.time ?? 0;
  }

  /**
   * The current animation duration in seconds.
   */
  get duration(): number {
    return this.__controls?.duration ?? 0;
  }

  /**
   * The current playback progress, from 0 to 1.
   */
  get progress(): number {
    const duration = this.duration;
    return duration > 0 ? this.time / duration : 0;
  }

  /**
   * Apply the `initial` styles, play the `animate` keyframes when `autoplay`
   * is enabled, then bind the gesture options.
   */
  async mounted() {
    const { initial, autoplay } = this.$options;
    const motion = await resolveMotion();

    if (!this.$isMounted) {
      return;
    }

    if (Object.keys(initial).length > 0) {
      motion.animate(this.$el, initial, { duration: 0 });
    }

    if (autoplay && this.__hasDeclaredAnimation) {
      this.play();
    }

    this.__bindGestures(motion);
  }

  /**
   * Whether the options declare an animation to play — the gate for
   * `autoplay`. Subclasses building their animation from another source
   * (e.g. `MotionSequence` from its children) override this.
   * @protected
   */
  get __hasDeclaredAnimation(): boolean {
    return Object.keys(this.$options.animate).length > 0;
  }

  /**
   * Stop the current animation and release the gesture bindings on unmount,
   * keeping the styles the animation reached.
   *
   * `unmounted()` rather than a cleanup returned by `mounted()`: the current
   * animation is not owned by the mount — any playback call creates it — so
   * the teardown does not pair with a piece of setup.
   */
  unmounted() {
    this.__completionToken += 1;
    this.__controls?.stop();
    this.__controls = null;

    for (const stop of this.__gestureStops) {
      stop();
    }
    this.__gestureStops = [];
  }

  /**
   * Play the animation declared by the `animate` and `transition` options
   * forward, creating it on first play — or recreating it when an imperative
   * `animate()` call superseded it. Restarts a finished animation. The
   * returned promise resolves when the animation settles.
   */
  async play(): Promise<void> {
    await resolveMotion();
    let controls = this.__controls;

    if (!controls || !this.__fromOptions) {
      controls?.stop();
      controls = this.__createControls();
    }

    controls.speed = Math.abs(controls.speed || 1);
    controls.play();
    this.$emit('motion-play');
    return this.__watchCompletion(controls);
  }

  /**
   * Play the animation declared by the options backward. When nothing has
   * played yet — or when an imperative `animate()` call superseded the
   * declared animation — it is created at its end so it plays back to its
   * starting styles. The returned promise resolves when the animation settles.
   */
  async reverse(): Promise<void> {
    await resolveMotion();
    let controls = this.__controls;

    if (!controls || !this.__fromOptions) {
      controls?.stop();
      controls = this.__createControls();
      controls.time = controls.duration;
    }

    controls.speed = -Math.abs(controls.speed || 1);
    controls.play();
    this.$emit('motion-play');
    return this.__watchCompletion(controls);
  }

  /**
   * Pause the current animation in place.
   */
  pause() {
    if (!this.__controls) {
      return;
    }

    this.__controls.pause();
    this.$emit('motion-pause');
  }

  /**
   * Animate to the given keyframes, replacing the current animation. The
   * options are merged over the `transition` option. The returned promise
   * resolves when the animation settles.
   */
  async animate(keyframes: DOMKeyframesDefinition, options?: AnimationOptions): Promise<void> {
    const motion = await resolveMotion();
    this.__completionToken += 1;
    this.__controls?.stop();
    const controls = motion.animate(this.$el, keyframes, {
      ...this.$options.transition,
      ...options,
    });
    this.__controls = controls;
    this.__fromOptions = false;
    this.$emit('motion-play');
    return this.__watchCompletion(controls);
  }

  /**
   * Seek the current animation to the given progress (0 to 1), creating it
   * paused when nothing has played yet.
   */
  async seek(progress: number) {
    await resolveMotion();
    let controls = this.__controls;

    if (!controls) {
      controls = this.__createControls();
      controls.pause();
    }

    controls.time = Math.min(Math.max(progress, 0), 1) * controls.duration;
  }

  /**
   * Stop the current animation, committing the styles it reached. The next
   * `play()` creates a fresh animation.
   */
  stop() {
    if (!this.__controls) {
      return;
    }

    this.__completionToken += 1;
    this.__controls.stop();
    this.__controls = null;
    this.$emit('motion-stop');
  }

  /**
   * Cancel the current animation, reverting the element to its pre-animation
   * styles. The next `play()` creates a fresh animation.
   */
  cancel() {
    if (!this.__controls) {
      return;
    }

    this.__completionToken += 1;
    this.__controls.cancel();
    this.__controls = null;
    this.$emit('motion-cancel');
  }

  /**
   * Jump the current animation to its end state.
   */
  complete() {
    this.__controls?.complete();
  }

  /**
   * Bind the `hover`, `press` and `inView` gesture options with Motion's own
   * gesture functions (touch-filtered, keyboard-accessible press, real
   * IntersectionObserver). Nothing binds when an option is empty, so idle
   * elements pay nothing. Gesture animations are transient: they never become
   * the current animation and emit no lifecycle events.
   * @private
   */
  __bindGestures(motion: MotionModule) {
    const { hover, press, inView, inViewMargin, inViewAmount, once } = this.$options;

    if (Object.keys(hover).length > 0) {
      if (motion.hover) {
        this.__gestureStops.push(
          motion.hover(this.$el, () => {
            this.__startGesture(hover);
            return () => this.__revertGesture(hover);
          }),
        );
      } else {
        this.__warnMissingGesture('hover');
      }
    }

    if (Object.keys(press).length > 0) {
      if (motion.press) {
        this.__gestureStops.push(
          motion.press(this.$el, () => {
            this.__startGesture(press);
            return () => this.__revertGesture(press);
          }),
        );
      } else {
        this.__warnMissingGesture('press');
      }
    }

    if (Object.keys(inView).length > 0) {
      if (motion.inView) {
        const options: { margin?: string; amount?: 'some' | 'all' | number } = {};
        if (inViewMargin) {
          options.margin = inViewMargin;
        }
        if (inViewAmount) {
          const numeric = Number(inViewAmount);
          options.amount = Number.isNaN(numeric) ? (inViewAmount as 'some' | 'all') : numeric;
        }
        this.__gestureStops.push(
          motion.inView(
            this.$el,
            () => {
              this.__startGesture(inView);
              // With no leave handler returned, `inView()` fires once and the
              // reached styles persist.
              if (once) {
                return undefined;
              }
              return () => this.__revertGesture(inView);
            },
            options as Parameters<NonNullable<MotionModule['inView']>>[2],
          ),
        );
      } else {
        this.__warnMissingGesture('inView');
      }
    }
  }

  /**
   * Animate to a gesture state, alongside — not replacing — the current
   * animation, capturing the base value of every property it touches first.
   * @private
   */
  __startGesture(keyframes: DOMKeyframesDefinition): AnimationPlaybackControlsWithThen {
    this.__captureBaseValues(keyframes);
    return getMotion().animate(this.$el, keyframes, this.$options.transition);
  }

  /**
   * Capture the element's current value for every property a gesture is about
   * to animate, once per property and never refreshed afterwards.
   *
   * The read mirrors Motion's own `VisualElement.readValueFromInstance()`: the
   * parsed transform matrix for a transform property, the computed style
   * otherwise — both through Motion's own readers, so the values come back in
   * the shape its animations expect. Motion React hydrates the same snapshot
   * (its `baseTarget`) the first time it reads a value and keeps it, which is
   * what makes a return immune to a second gesture starting while the previous
   * one is still returning.
   *
   * A property the readers cannot resolve is left out, so nothing is invented:
   * the return animation simply does not touch it.
   * @private
   */
  __captureBaseValues(keyframes: DOMKeyframesDefinition) {
    const { transformProps, readTransformValue, getComputedStyle } = getMotion();

    for (const property of Object.keys(keyframes)) {
      if (property in this.__baseValues) {
        continue;
      }

      if (readTransformValue && transformProps?.has(property)) {
        this.__baseValues[property] = readTransformValue(this.$el, property);
        continue;
      }

      const computed = getComputedStyle?.(this.$el, property);

      if (typeof computed === 'string' && computed !== '') {
        const numeric = Number(computed);
        this.__baseValues[property] = Number.isNaN(numeric) ? computed : numeric;
      }
    }
  }

  /**
   * Return the element to its base values when a gesture ends, animating
   * forward with the `transition` option — the gesture animation is never
   * rewound.
   *
   * This is what Motion React does: ending a gesture deactivates its variant
   * (`node.animationState.setActive("whileHover", false)`), which recomputes
   * the target of every property the variant owned and animates to it. Playing
   * the gesture animation backward instead would run its easing or spring
   * curve in reverse — a different feel — and could never reach a base value
   * the element did not hold when the gesture started.
   * @private
   */
  __revertGesture(keyframes: DOMKeyframesDefinition) {
    const base: Record<string, string | number> = {};

    for (const property of Object.keys(keyframes)) {
      if (property in this.__baseValues) {
        base[property] = this.__baseValues[property];
      }
    }

    if (Object.keys(base).length === 0) {
      return;
    }

    getMotion().animate(this.$el, base as DOMKeyframesDefinition, this.$options.transition);
  }

  /**
   * Warn about a gesture option the resolved motion module cannot honor.
   * @private
   */
  __warnMissingGesture(name: string) {
    this.$warn(
      'motion.missing-gesture',
      `The resolved motion module has no \`${name}()\` (e.g. \`motion/mini\`). Provide the full \`motion\` entry to use the \`${name}\` option.`,
    );
  }

  /**
   * Create the animation from the `animate` and `transition` options and make
   * it the current one. Subclasses override this to build the current
   * animation from another source.
   * @protected
   */
  __createControls(): AnimationPlaybackControlsWithThen {
    const { transition } = this.$options;
    const controls = getMotion().animate(this.$el, this.keyframes, transition);
    this.__controls = controls;
    this.__fromOptions = true;
    return controls;
  }

  /**
   * The keyframes of the declared animation, with the `initial` styles folded
   * in as the starting point of every property they both describe.
   *
   * Motion reads a lone target value as "from wherever the element is now", so
   * a settled animation would have nothing left to move on the next `play()`.
   * Pairing each such value with its `initial` counterpart pins the start, and
   * the animation replays identically for as long as the options stand. A
   * property already written as a `[from, to]` array is left untouched, and so
   * is one the `initial` styles say nothing about — there, animating from the
   * current state is the point.
   */
  get keyframes(): DOMKeyframesDefinition {
    const initial = this.$options.initial as Record<string, unknown>;
    const keyframes: Record<string, unknown> = { ...(this.$options.animate as object) };

    for (const [property, to] of Object.entries(keyframes)) {
      if (!Array.isArray(to) && property in initial) {
        keyframes[property] = [initial[property], to];
      }
    }

    return keyframes as DOMKeyframesDefinition;
  }

  /**
   * Emit `motion-complete` when the given animation finishes, unless another
   * playback superseded it in the meantime. The returned promise resolves when
   * the animation settles and never rejects, so playback methods can safely
   * hand it to callers that do not catch.
   * @private
   */
  __watchCompletion(controls: AnimationPlaybackControlsWithThen): Promise<void> {
    const token = ++this.__completionToken;
    return new Promise((resolve) => {
      controls.then(() => {
        if (token === this.__completionToken && this.__controls === controls) {
          this.$emit('motion-complete');
        }
        resolve();
      }, resolve);
    });
  }
}

export default Motion;
