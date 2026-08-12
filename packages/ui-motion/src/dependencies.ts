import type { animate, scroll } from 'motion';

/**
 * The subset of the `motion` module the components consume. Declared
 * structurally so a host can inject the full `motion` entry, the smaller
 * `motion/mini` entry or any compatible build — only the members listed here
 * are ever read. `scroll` is optional because `motion/mini` does not ship it;
 * only `MotionScrollTimeline` needs it.
 */
export interface MotionModule {
  animate: typeof animate;
  scroll?: typeof scroll;
}

let motionInstance: MotionModule | undefined;
let motionPromise: Promise<MotionModule> | undefined;
let motionProvided = false;

/**
 * Inject the `motion` module the components should use.
 *
 * Call once, before the components mount (e.g. right before `createApp`). Once
 * provided, `@studiometa/ui-motion` never imports `motion` by specifier — it
 * uses this instance — so a host can supply its own build (a specific version,
 * the smaller `motion/mini` entry, an import-map or CDN module).
 *
 * @param {MotionModule} instance The `motion` module namespace.
 */
export function provideMotion(instance: MotionModule): void {
  motionProvided = true;
  motionInstance = instance;
  motionPromise = Promise.resolve(instance);
}

/**
 * Resolve the `motion` module: the injected instance when one was provided
 * through {@link provideMotion}, otherwise a lazily loaded `import('motion')`.
 *
 * The result is memoized, so `motion` loads at most once and repeated calls
 * are cheap. The resolved instance is also cached for {@link getMotion}.
 *
 * @returns {Promise<MotionModule>}
 */
export function resolveMotion(): Promise<MotionModule> {
  if (!motionPromise) {
    motionPromise = import('motion').then((module) => {
      const instance = module as MotionModule;
      // A provideMotion() call may have won the race while this import was in
      // flight: never let the fallback overwrite an injected instance. Returning
      // the authoritative instance also keeps callers that awaited this promise
      // before the injection consistent with the provided one.
      if (!motionProvided) {
        motionInstance = instance;
      }
      return motionInstance as MotionModule;
    });
  }

  return motionPromise;
}

/**
 * Synchronously read the resolved `motion` module.
 *
 * Only valid after {@link resolveMotion} (or {@link provideMotion}) has run;
 * it throws otherwise. Components read it on synchronous hot paths that are
 * only ever reached once their animation — and therefore `motion` — is ready.
 *
 * @returns {MotionModule}
 */
export function getMotion(): MotionModule {
  if (!motionInstance) {
    throw new Error(
      '[@studiometa/ui-motion] motion has not been resolved yet. Await resolveMotion() (or call provideMotion()) before reading it synchronously.',
    );
  }

  return motionInstance;
}
