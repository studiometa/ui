import packageMetadata from '../package.json' with { type: 'json' };
import { ComponentLoader, type LoaderDependencies } from './loader.js';
import { componentManifest } from './manifest.js';
import type { ComponentManifestEntry } from './manifest.js';

const SCRIPT_SELECTOR = 'script[data-studiometa-ui]';
const RUNTIME_KEY = Symbol.for('@studiometa/ui-cdn/runtime');
const DIAGNOSTIC_PREFIX = '[@studiometa/ui-cdn]';

export interface CdnRuntime {
  packageName: '@studiometa/ui-cdn';
  version: string;
  loader: ComponentLoader;
}

export interface AutoloadOptions {
  document?: Document;
  globalObject?: object;
  version?: string;
  manifest?: Record<string, ComponentManifestEntry>;
  loaderDependencies?: Partial<LoaderDependencies>;
  console?: Pick<Console, 'warn'>;
}

function getEagerComponents(script: HTMLScriptElement, logger: Pick<Console, 'warn'>): string[] {
  if (!script.src) {
    return [];
  }

  let url: URL;
  try {
    url = new URL(script.src, script.ownerDocument.baseURI);
  } catch {
    logger.warn(
      `${DIAGNOSTIC_PREFIX} The marked script URL is invalid; eager components were ignored.`,
    );
    return [];
  }

  return [
    ...new Set(
      url.searchParams
        .getAll('components')
        .flatMap((value) => value.split(','))
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  ];
}

/** Start the declarative CDN runtime for the single marked script in the document. */
export function startAutoload(options: AutoloadOptions = {}): CdnRuntime | undefined {
  const documentObject = options.document ?? document;
  const globalObject = options.globalObject ?? globalThis;
  const version = options.version ?? packageMetadata.version;
  const manifest = options.manifest ?? componentManifest;
  const logger = options.console ?? console;
  const scripts = [...documentObject.querySelectorAll<HTMLScriptElement>(SCRIPT_SELECTOR)];

  // A marked script is optional: it only carries the eager `?components=` hint and anchors
  // duplicate detection. When the module is imported directly from JavaScript there is no such
  // script, so start component discovery silently instead of warning about a missing attribute.
  if (scripts.length > 1) {
    const sources = new Set(scripts.map((script) => script.src));
    logger.warn(
      sources.size === 1
        ? `${DIAGNOSTIC_PREFIX} Repeated data-studiometa-ui scripts were found; loading stopped.`
        : `${DIAGNOSTIC_PREFIX} Conflicting data-studiometa-ui scripts were found; loading stopped.`,
    );
    return undefined;
  }

  const runtimeHost = globalObject as Record<PropertyKey, unknown>;
  const existingRuntime = runtimeHost[RUNTIME_KEY] as CdnRuntime | undefined;
  if (existingRuntime) {
    if (
      existingRuntime.packageName === '@studiometa/ui-cdn' &&
      existingRuntime.version === version
    ) {
      logger.warn(
        `${DIAGNOSTIC_PREFIX} Version ${version} is already active; the repeated script was ignored.`,
      );
      return existingRuntime;
    }

    logger.warn(
      `${DIAGNOSTIC_PREFIX} A conflicting CDN runtime version is already active; loading stopped.`,
    );
    return undefined;
  }

  const loader = new ComponentLoader({
    manifest,
    dependencies: {
      document: documentObject,
      console: options.loaderDependencies?.console ?? console,
      ...options.loaderDependencies,
    },
  });
  const runtime: CdnRuntime = {
    packageName: '@studiometa/ui-cdn',
    version,
    loader,
  };
  runtimeHost[RUNTIME_KEY] = runtime;
  const markedScript = scripts[0];
  loader.start({
    eagerComponents: markedScript ? getEagerComponents(markedScript, logger) : [],
  });
  return runtime;
}

if (typeof document !== 'undefined') {
  startAutoload();
}
