import type {
  BaseConfig,
  BaseProps,
  ChildrenCollection,
  MountedReturn,
  OptionChange,
} from '@studiometa/js-toolkit';
import { whenDOMSettled } from '@studiometa/js-toolkit/whenDOMSettled';
import type { gsap } from 'gsap';
import { AbstractGsapAnimation } from './AbstractGsapAnimation.js';
import type { AbstractGsapAnimationProps, GsapAnimationVars } from './AbstractGsapAnimation.js';
import type { GsapDependencies } from './dependencies.js';
import { addDeclaration, readDeclaration, readPosition, readVars } from './declaration.js';
import { GsapStep } from './GsapStep.js';

export interface GsapTimelineProps extends BaseProps {
  $options: AbstractGsapAnimationProps['$options'] & {
    timeline: gsap.TimelineVars;
  };
}

/**
 * Whether an element declares a `GsapTimeline`.
 */
function declaresTimeline(element: Element): boolean {
  return (element.getAttribute('data-component') ?? '').split(/\s+/).includes('GsapTimeline');
}

/**
 * GsapTimeline class.
 *
 * Compose the `GsapStep` descendants of the root element into one
 * [GSAP](https://gsap.com) timeline, in DOM order. A step belongs to its
 * nearest `GsapTimeline` ancestor only. The timeline rebuilds when a step is
 * added, removed or moved, and when the options of a step change.
 *
 * The `timeline` option takes the timeline variables, for example
 * `defaults`, `repeat` or `yoyo`.
 *
 * @link https://ui.studiometa.dev/reference/items/GsapTimeline/
 */
export class GsapTimeline<T extends BaseProps = BaseProps> extends AbstractGsapAnimation<
  GsapTimelineProps & T
> {
  static config: BaseConfig = {
    name: 'GsapTimeline',
    components: { GsapStep },
    options: {
      timeline: Object,
    },
  };

  /** The live collection of the `GsapStep` descendants. */
  __steps: ChildrenCollection<GsapStep> | null = null;

  /** The steps of the committed timeline, in order. */
  __builtSteps: GsapStep[] = [];

  /**
   * The steps that this timeline owns, in DOM order.
   */
  get steps(): GsapStep[] {
    return (this.__steps?.items ?? []).filter((step) => this.__owns(step));
  }

  /**
   * Watch the steps, then start the build.
   */
  mounted(): MountedReturn {
    // A watcher lasts as long as the instance, so one is enough for every
    // mount. Its callbacks are ignored while the timeline is not mounted.
    this.__steps ??= this.$watchChildren(GsapStep, {
      added: () => this.__stepsChanged(),
      removed: () => this.__stepsChanged(),
    });

    return [super.mounted(), () => (this.__builtSteps = [])];
  }

  optionTimelineChanged(change: OptionChange) {
    this.__optionChanged(change);
  }

  /**
   * Rebuild when the owned steps differ from the steps of the committed
   * timeline.
   * @private
   */
  __stepsChanged() {
    // A pending build reads the steps when it commits.
    if (!this.$isMounted || this.__isPending) {
      return;
    }

    const steps = this.steps;
    const built = this.__builtSteps;

    if (steps.length !== built.length || steps.some((step, index) => step !== built[index])) {
      this.rebuild();
    }
  }

  /**
   * Whether this timeline is the nearest `GsapTimeline` ancestor of a step.
   * @private
   */
  __owns(step: GsapStep): boolean {
    let element = step.$el.parentElement;

    while (element && element !== this.$el) {
      if (declaresTimeline(element)) {
        return false;
      }
      element = element.parentElement;
    }

    return element === this.$el;
  }

  /**
   * Wait until the steps of the DOM are mounted.
   * @protected
   */
  async __prepare() {
    await whenDOMSettled();
  }

  /**
   * Create the timeline from the owned steps.
   * @protected
   */
  __create({ gsap: core }: GsapDependencies, vars: GsapAnimationVars) {
    const steps = this.steps;
    this.__builtSteps = steps;

    const timeline = core.timeline({
      ...readVars<gsap.TimelineVars>(this, 'timeline', this.$options.timeline),
      ...vars,
    });

    let count = 0;

    for (const step of steps) {
      const declaration = readDeclaration(step, step.$el, step.$options);

      if (declaration) {
        addDeclaration(timeline, declaration, readPosition(step.$options.at));
        count += 1;
      }
    }

    // An empty timeline has nothing to play. It is built again when a step
    // is added.
    return count > 0 ? timeline : null;
  }
}

export default GsapTimeline;
