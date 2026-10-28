import type { gsap } from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * The GSAP modules the components consume. `ScrollTrigger` is optional: it is
 * only needed by a component with a `scrollTrigger` option.
 */
export interface GsapDependencies {
  gsap: typeof gsap;
  ScrollTrigger?: typeof ScrollTrigger;
}

export interface ResolveGsapOptions {
  /** Also resolve the `ScrollTrigger` plugin. */
  scrollTrigger?: boolean;
}

/** The dependencies given to {@link provideGsap}. */
let provided: GsapDependencies | undefined;

/** The dependencies loaded by the fallback imports. */
let imported: GsapDependencies | undefined;

let corePromise: Promise<typeof gsap> | undefined;
let scrollTriggerPromise: Promise<typeof ScrollTrigger> | undefined;

/** The plugins already registered, per `gsap` instance. */
const registeredPlugins = new WeakMap<object, WeakSet<object>>();

/**
 * Read an export from a module namespace. GSAP ships its modules with a named
 * export and a default export, and some bundlers and CDNs keep only one of the
 * two: accept both.
 */
function readExport<T>(module: unknown, name: string): T {
  const namespace = module as Record<string, unknown>;
  return (namespace[name] ?? namespace.default) as T;
}

/**
 * Register each plugin once on its `gsap` instance.
 */
function registerPlugins(dependencies: GsapDependencies): GsapDependencies {
  const { gsap: core, ScrollTrigger: plugin } = dependencies;

  if (plugin) {
    let plugins = registeredPlugins.get(core);
    if (!plugins) {
      plugins = new WeakSet();
      registeredPlugins.set(core, plugins);
    }

    if (!plugins.has(plugin)) {
      core.registerPlugin(plugin);
      plugins.add(plugin);
    }
  }

  return dependencies;
}

/**
 * Load a module once. A failed import is forgotten, so a later call can try
 * again.
 */
function load<T>(
  current: Promise<T> | undefined,
  set: (promise: Promise<T> | undefined) => void,
  importer: () => Promise<T>,
): Promise<T> {
  if (current) {
    return current;
  }

  const promise = importer().catch((error: unknown) => {
    set(undefined);
    throw error;
  });
  set(promise);
  return promise;
}

function importCore(): Promise<typeof gsap> {
  return load(
    corePromise,
    (promise) => (corePromise = promise),
    () => import('gsap').then((module) => readExport<typeof gsap>(module, 'gsap')),
  );
}

function importScrollTrigger(): Promise<typeof ScrollTrigger> {
  return load(
    scrollTriggerPromise,
    (promise) => (scrollTriggerPromise = promise),
    () =>
      import('gsap/ScrollTrigger').then((module) =>
        readExport<typeof ScrollTrigger>(module, 'ScrollTrigger'),
      ),
  );
}

/**
 * Inject the GSAP modules the components use.
 *
 * Call it once, before the components mount. After this call,
 * `@studiometa/ui-gsap` never imports `gsap` by specifier, and it never
 * imports a plugin that the call did not give. An injection also wins over an
 * import that is still in progress.
 *
 * @param {GsapDependencies} dependencies The `gsap` core and its plugins.
 */
export function provideGsap(dependencies: GsapDependencies): void {
  provided = registerPlugins({ ...dependencies });
}

/**
 * Resolve the GSAP modules: the injected ones when {@link provideGsap} was
 * called, otherwise a lazy `import('gsap')`. The `ScrollTrigger` plugin is
 * imported only when `scrollTrigger` is `true`, and registered once.
 *
 * Each import runs at most once. A custom component can use this function to
 * build an advanced scene with the same GSAP instance as the components.
 *
 * @param   {ResolveGsapOptions} [options]
 * @returns {Promise<GsapDependencies>}
 */
export async function resolveGsap(options: ResolveGsapOptions = {}): Promise<GsapDependencies> {
  if (provided) {
    return provided;
  }

  const core = await importCore();

  if (provided) {
    return provided;
  }

  imported ??= { gsap: core };

  if (options.scrollTrigger && !imported.ScrollTrigger) {
    const plugin = await importScrollTrigger();

    if (provided) {
      return provided;
    }

    imported = registerPlugins({ ...imported, ScrollTrigger: plugin });
  }

  return imported;
}

/**
 * Read the resolved GSAP modules synchronously.
 *
 * It is only valid after {@link resolveGsap} or {@link provideGsap}, and it
 * throws before.
 *
 * @returns {GsapDependencies}
 */
export function getGsap(): GsapDependencies {
  const dependencies = provided ?? imported;

  if (!dependencies) {
    throw new Error(
      '[@studiometa/ui-gsap] gsap has not been resolved yet. Await resolveGsap() (or call provideGsap()) before reading it synchronously.',
    );
  }

  return dependencies;
}
