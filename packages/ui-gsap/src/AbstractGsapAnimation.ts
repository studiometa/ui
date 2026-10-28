import { Base } from '@studiometa/js-toolkit/Base';
import { usePrefersReducedMotion } from '@studiometa/js-toolkit/usePrefersReducedMotion';
import type { BaseConfig, BaseProps, MountedReturn, OptionChange } from '@studiometa/js-toolkit';
import type { gsap } from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { resolveGsap } from './dependencies.js';
import type { GsapDependencies } from './dependencies.js';
import { readScrollTrigger } from './declaration.js';
import type { ScrollTriggerOption } from './declaration.js';

/**
 * The payload of every `gsap-*` event. The animation is ephemeral: a rebuild
 * replaces it, so do not keep a reference to it.
 */
export interface GsapEventDetail {
  animation: gsap.core.Animation;
  progress: number;
}

export interface AbstractGsapAnimationProps extends BaseProps {
  $options: {
    scrollTrigger: ScrollTriggerOption;
    autoplay: boolean;
  };
  $emits: {
    'gsap-ready': GsapEventDetail;
    'gsap-play': GsapEventDetail;
    'gsap-pause': GsapEventDetail;
    'gsap-complete': GsapEventDetail;
    'gsap-reverse-complete': GsapEventDetail;
    'gsap-interrupt': GsapEventDetail;
  };
}

/**
 * The variables the lifecycle adds to the animation of a build: `paused`, or
 * the `scrollTrigger` that drives it.
 */
export interface GsapAnimationVars {
  paused?: boolean;
  scrollTrigger?: ScrollTrigger.Vars;
}

/**
 * What the next committed build must do with its animation. The playback
 * commands update it before the animation exists, and a rebuild copies the
 * state of the animation it replaces.
 */
interface PlaybackIntent {
  paused: boolean;
  reversed: boolean;
  /** Total progress to restore, from 0 to 1. */
  progress: number | null;
  /** Position to seek, after the progress. */
  seek: gsap.Position | null;
}

/**
 * Clamp a progress to the 0–1 range. A value that is not a number becomes 0.
 */
function normalizeProgress(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/**
 * The lifecycle shared by `Gsap` and `GsapTimeline`.
 *
 * - `mounted()` stays synchronous: it starts the asynchronous resolution of
 *   GSAP and returns its cleanup immediately.
 * - Each mount starts an epoch and each build request a revision. An
 *   asynchronous build commits only if both are still current, so a stale
 *   build never survives an unmount or a newer rebuild.
 * - Each committed build owns one `gsap.context()`. Rebuild, unmount and
 *   reduced motion revert it through {@link AbstractGsapAnimation.__revert},
 *   the one cleanup path.
 * - Option changes after the mount schedule one rebuild per `$write()` batch.
 * - When the user prefers reduced motion, GSAP is not resolved and nothing is
 *   built, so the authored DOM state stays.
 *
 * @private
 */
export class AbstractGsapAnimation<T extends BaseProps = BaseProps> extends Base<
  AbstractGsapAnimationProps & T
> {
  static config: BaseConfig = {
    name: 'AbstractGsapAnimation',
    mountStrategy: 'eager',
    options: {
      scrollTrigger: { type: [Object, Boolean], default: false },
      autoplay: Boolean,
    },
  };

  /** Incremented on each mount and unmount. */
  __epoch = 0;

  /** Incremented on each build request. */
  __revision = 0;

  __context: gsap.Context | null = null;

  __animation: gsap.core.Animation | null = null;

  /** Whether the committed animation is driven by a `ScrollTrigger`. */
  __scrollDriven = false;

  __intent: PlaybackIntent = { paused: true, reversed: false, progress: null, seek: null };

  __reducedMotion = false;

  __rebuildTask: ReturnType<Base['$write']> | null = null;

  /** The revision of the build that waits for GSAP or the DOM, or 0. */
  __pendingRevision = 0;

  /**
   * The current animation, or `null` before the first build, in reduced
   * motion and after the unmount. A rebuild replaces it: read it when you
   * need it, and do not keep a reference.
   */
  get animation(): gsap.core.Animation | null {
    return this.__animation;
  }

  /**
   * The progress of the current animation, from 0 to 1.
   */
  get progress(): number {
    return this.__animation?.progress() ?? 0;
  }

  /**
   * The duration of the current animation, in seconds.
   */
  get duration(): number {
    return this.__animation?.duration() ?? 0;
  }

  /**
   * Start the first build and watch the reduced motion preference.
   */
  mounted(): MountedReturn {
    this.__epoch += 1;
    this.__rebuildTask = null;
    this.__intent = {
      paused: !this.$options.autoplay,
      reversed: false,
      progress: null,
      seek: null,
    };

    const reducedMotion = usePrefersReducedMotion();
    this.__reducedMotion = reducedMotion.props().matches;
    const unsubscribe = reducedMotion.subscribe(({ matches }) =>
      this.__reducedMotionChanged(matches),
    );

    this.__build();

    return () => {
      unsubscribe();
      this.__epoch += 1;
      this.__revision += 1;
      this.__revert();
    };
  }

  /**
   * Revert the animation when the user starts to prefer reduced motion, and
   * build it again when the preference ends.
   * @private
   */
  __reducedMotionChanged(matches: boolean) {
    if (matches === this.__reducedMotion) {
      return;
    }

    this.__reducedMotion = matches;

    if (matches) {
      this.__revision += 1;
      this.__keepIntent();
      this.__revert();
    } else {
      this.__build();
    }
  }

  optionScrollTriggerChanged(change: OptionChange) {
    this.__optionChanged(change);
  }

  /**
   * Play when `autoplay` becomes `true` after the mount, for example at a
   * responsive breakpoint. Turning it off keeps the current playback.
   */
  optionAutoplayChanged(change: OptionChange<boolean>) {
    if (!change.initial && change.value) {
      this.play();
    }
  }

  /**
   * Schedule a rebuild for an option change after the mount. The first call
   * of each option is part of the mount, which already builds.
   * @protected
   */
  __optionChanged(change: OptionChange) {
    if (!change.initial) {
      this.rebuild();
    }
  }

  /**
   * Build the animation again from the current options and DOM. Calls in the
   * same frame give one rebuild.
   */
  rebuild() {
    if (this.__rebuildTask || !this.$isMounted) {
      return;
    }

    this.__rebuildTask = this.$write(() => {
      this.__rebuildTask = null;
      this.__build();
    });
  }

  /**
   * Play forward from the current position.
   */
  play() {
    this.__command(
      { paused: false, reversed: false },
      (animation) => animation.play(),
      'gsap-play',
    );
  }

  /**
   * Pause at the current position.
   */
  pause() {
    this.__command({ paused: true }, (animation) => animation.pause(), 'gsap-pause');
  }

  /**
   * Play backward from the current position.
   */
  reverse() {
    this.__command(
      { paused: false, reversed: true },
      (animation) => animation.reverse(),
      'gsap-play',
    );
  }

  /**
   * Play forward from the start.
   */
  restart() {
    this.__command(
      { paused: false, reversed: false, progress: 0, seek: null },
      (animation) => animation.restart(),
      'gsap-play',
    );
  }

  /**
   * Jump to a time in seconds or to a label, and keep the playback state.
   */
  seek(position: gsap.Position) {
    this.__command({ seek: position }, (animation) => animation.seek(position));
  }

  /**
   * Jump to the end, and pause.
   */
  complete() {
    this.__command({ paused: true, reversed: false, progress: 1, seek: null }, (animation) =>
      animation.pause().totalProgress(1),
    );
  }

  /**
   * Keep a playback command as intent for the next build, and apply it to the
   * current animation.
   * @private
   */
  __command(
    intent: Partial<PlaybackIntent>,
    apply: (animation: gsap.core.Animation) => void,
    event?: 'gsap-play' | 'gsap-pause',
  ) {
    Object.assign(this.__intent, intent);

    const animation = this.__animation;

    if (!animation) {
      return;
    }

    apply(animation);
    this.__intent.seek = null;

    if (event) {
      this.__emit(event, animation);
    }
  }

  /**
   * Whether the component uses a `ScrollTrigger`.
   * @protected
   */
  get __usesScrollTrigger(): boolean {
    return this.$options.scrollTrigger !== false;
  }

  /**
   * Wait for what the build reads from the DOM. Subclasses override it.
   * @protected
   */
  async __prepare(): Promise<void> {}

  /**
   * Create the animation in the GSAP context. Subclasses override it. Return
   * `null` when there is nothing to animate.
   * @protected
   */
  __create(_dependencies: GsapDependencies, _vars: GsapAnimationVars): gsap.core.Animation | null {
    return null;
  }

  /**
   * Resolve GSAP, then commit a build if it is still current.
   * @private
   */
  async __build() {
    const epoch = this.__epoch;
    const revision = ++this.__revision;
    const isCurrent = () =>
      epoch === this.__epoch &&
      revision === this.__revision &&
      this.$isMounted &&
      !this.__reducedMotion;

    if (!isCurrent()) {
      return;
    }

    let dependencies: GsapDependencies;
    this.__pendingRevision = revision;

    try {
      dependencies = await resolveGsap({ scrollTrigger: this.__usesScrollTrigger });
      await this.__prepare();
    } catch (error) {
      if (isCurrent()) {
        this.$error('gsap.build-failed', 'GSAP could not be resolved.', error);
      }
      return;
    } finally {
      if (this.__pendingRevision === revision) {
        this.__pendingRevision = 0;
      }
    }

    if (isCurrent()) {
      this.__commit(dependencies);
    }
  }

  /**
   * Whether a build waits for GSAP or the DOM. That build reads the options
   * and the DOM when it commits.
   * @protected
   */
  get __isPending(): boolean {
    return this.__pendingRevision !== 0 && this.__pendingRevision === this.__revision;
  }

  /**
   * Replace the current animation with a new build.
   * @private
   */
  __commit(dependencies: GsapDependencies) {
    this.__keepIntent();
    this.__revert();

    let scrollTrigger: ScrollTrigger.Vars | undefined;
    const option = this.$options.scrollTrigger;

    if (option !== false) {
      if (!dependencies.ScrollTrigger) {
        this.$warn(
          'gsap.missing-scroll-trigger',
          'The `scrollTrigger` option needs the ScrollTrigger plugin. Give it to `provideGsap()`.',
        );
        return;
      }

      const vars = readScrollTrigger(this, this.$el, option);

      if (!vars) {
        return;
      }

      scrollTrigger = vars;
    }

    const context = dependencies.gsap.context(() => {}, this.$el);
    const vars = scrollTrigger ? { scrollTrigger } : { paused: true };
    // A throw inside `context.add()` would leave the context active in GSAP
    // and record every later animation of the page in it: catch it inside.
    let failure: { error: unknown } | null = null;
    const animation = context.add(() => {
      try {
        return this.__create(dependencies, vars);
      } catch (error) {
        failure = { error };
        return null;
      }
    });

    if (failure) {
      context.revert();
      this.$error(
        'gsap.build-failed',
        'GSAP could not build the animation.',
        (failure as { error: unknown }).error,
      );
      return;
    }

    // A build without an animation keeps its context: `set` variables can
    // still have changed the DOM.
    this.__context = context;

    if (!animation) {
      return;
    }

    this.__animation = animation;
    this.__scrollDriven = Boolean(scrollTrigger);
    this.__bindCallbacks(animation);

    if (!scrollTrigger) {
      this.__applyIntent(animation);
    }

    this.__emit('gsap-ready', animation);

    if (!scrollTrigger && !this.__intent.paused) {
      this.__emit('gsap-play', animation);
    }
  }

  /**
   * Copy the state of the current animation into the intent, so the next
   * build starts where it stopped. A scroll-driven build reads its state from
   * the scroll position instead.
   * @private
   */
  __keepIntent() {
    const animation = this.__animation;

    if (!animation || this.__scrollDriven) {
      return;
    }

    this.__intent.progress = normalizeProgress(animation.totalProgress());
    this.__intent.reversed = animation.reversed();
    // A finished animation stays finished: it must not play, nor complete
    // again, after the rebuild.
    const finished = this.__intent.reversed
      ? this.__intent.progress === 0
      : this.__intent.progress === 1;
    this.__intent.paused = animation.paused() || finished;
    this.__intent.seek = null;
  }

  /**
   * Apply the intent to a new animation.
   * @private
   */
  __applyIntent(animation: gsap.core.Animation) {
    const { progress, seek, reversed, paused } = this.__intent;

    // Restoring a position must not fire the callbacks of the positions it
    // jumps over.
    if (progress !== null) {
      animation.totalProgress(progress, true);
    }

    if (seek !== null) {
      animation.seek(seek, true);
      this.__intent.seek = null;
    }

    animation.reversed(reversed);
    animation.paused(paused);
  }

  /**
   * Emit the lifecycle events of an animation while it is the current one.
   * @private
   */
  __bindCallbacks(animation: gsap.core.Animation) {
    const callbacks = [
      ['onComplete', 'gsap-complete'],
      ['onReverseComplete', 'gsap-reverse-complete'],
      ['onInterrupt', 'gsap-interrupt'],
    ] as const;

    for (const [callback, event] of callbacks) {
      animation.eventCallback(callback, () => {
        if (this.__animation === animation) {
          this.__emit(event, animation);
        }
      });
    }
  }

  /**
   * Revert the GSAP context of the current build. This is the only place that
   * reverts a context.
   * @private
   */
  __revert() {
    const context = this.__context;
    this.__context = null;
    this.__animation = null;
    this.__scrollDriven = false;
    context?.revert();
  }

  /**
   * @private
   */
  __emit(
    event:
      | 'gsap-ready'
      | 'gsap-play'
      | 'gsap-pause'
      | 'gsap-complete'
      | 'gsap-reverse-complete'
      | 'gsap-interrupt',
    animation: gsap.core.Animation,
  ) {
    (this as Base).$emit(event, { animation, progress: animation.progress() });
  }
}
