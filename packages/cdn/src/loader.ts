// The declarative loader engine lives in the generic, side-effect-free `@studiometa/ui-autoload`
// package. The CDN serves it as the stable `loader.js` entry so advanced consumers can drive the
// loader directly, so this module simply re-exports the engine and its public types.
export {
  ComponentLoader,
  DEFAULT_DIAGNOSTIC_PREFIX,
  VISIBLE_ROOT_MARGIN,
  IDLE_TIMEOUT,
  composeManifests,
  autoload,
  type LoaderDependencies,
  type ComponentLoaderOptions,
  type ComponentLoaderStartOptions,
  type AutoloadOptions,
  type AutoloadHandle,
  type ComponentManifest,
  type ComponentManifestEntry,
  type ComponentLoadStrategy,
} from '@studiometa/ui-autoload';
