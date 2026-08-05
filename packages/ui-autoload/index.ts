export type {
  ComponentLoadStrategy,
  ComponentManifestEntry,
  ComponentManifest,
  CuratedComponentMetadata,
  ComponentCatalog,
} from './types.js';
export {
  ComponentLoader,
  DEFAULT_DIAGNOSTIC_PREFIX,
  VISIBLE_ROOT_MARGIN,
  IDLE_TIMEOUT,
  type LoaderDependencies,
  type ComponentLoaderOptions,
  type ComponentLoaderStartOptions,
} from './loader.js';
export {
  autoload,
  composeManifests,
  type AutoloadOptions,
  type AutoloadHandle,
} from './autoload.js';
export {
  registerManifest,
  readEagerTokens,
  type AutoloadRuntime,
  type RegisterManifestOptions,
} from './runtime.js';
