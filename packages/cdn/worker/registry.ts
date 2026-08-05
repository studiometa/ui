import type { BuildMetadata, RegistryComponent, RegistryDocument, VersionsIndex } from './types.ts';

export interface RegistryInput {
  /** Absolute origin the registry builds its URLs from (e.g. `https://cdn.studiometa.dev`). */
  origin: string;
  /** The parsed versions index, or `undefined` when it could not be read or validated. */
  versions?: VersionsIndex;
  /** The reference reported as the current ui surface, resolved from the index. */
  currentUiRef: string | null;
  /** The reference reported as the current ui-mapbox surface, resolved from the index. */
  currentUiMapboxRef: string | null;
  /** The reference reported as the current ui-autoload surface, resolved from the index. */
  currentUiAutoloadRef: string | null;
  /** The version reported as the current js-toolkit surface, resolved from the index. */
  currentJsToolkit: string | null;
  /** The current ui ref's build metadata, or `undefined` when it is absent or unreadable. */
  currentUiBuild?: BuildMetadata;
  /** The current ui-mapbox ref's build metadata, or `undefined` when it is absent or unreadable. */
  currentUiMapboxBuild?: BuildMetadata;
}

/**
 * Builds the JSON registry served at the CDN root from already-read index and metadata. Everything
 * here is pure: I/O and its failure handling stay in the Worker handler, so the builder degrades to
 * empty inventories, null `current` values, and no component/entry URLs whenever an input is
 * missing rather than throwing.
 */
export function buildRegistry(input: RegistryInput): RegistryDocument {
  const {
    origin,
    versions,
    currentUiRef,
    currentUiMapboxRef,
    currentUiAutoloadRef,
    currentJsToolkit,
    currentUiBuild,
    currentUiMapboxBuild,
  } = input;
  const ui = versions?.packages.ui;
  const uiMapbox = versions?.packages['ui-mapbox'];
  const uiAutoload = versions?.packages['ui-autoload'];
  const jsToolkit = versions?.packages['js-toolkit'];

  // Each package's components import from their own versioned tree: `@studiometa/ui` from
  // `/ui@<ref>/<subpath>.js` and `@studiometa/ui-mapbox` from `/ui-mapbox@<ref>/<subpath>.js`.
  const hasUiSurface = currentUiRef !== null && currentUiBuild !== undefined;
  const hasUiMapboxSurface = currentUiMapboxRef !== null && currentUiMapboxBuild !== undefined;
  const uiComponents: RegistryComponent[] =
    hasUiSurface && currentUiBuild
      ? Object.entries(currentUiBuild.components).map(([token, component]) => ({
          token,
          package: component.packageName,
          url: `${origin}/ui@${currentUiRef}/${component.subpath}.js`,
        }))
      : [];
  const uiMapboxComponents: RegistryComponent[] =
    hasUiMapboxSurface && currentUiMapboxBuild
      ? Object.entries(currentUiMapboxBuild.components).map(([token, component]) => ({
          token,
          package: component.packageName,
          url: `${origin}/ui-mapbox@${currentUiMapboxRef}/${component.subpath}.js`,
        }))
      : [];
  const components = [...uiComponents, ...uiMapboxComponents].sort((left, right) =>
    left.token.localeCompare(right.token),
  );

  const entries: Record<string, string> = {};
  if (hasUiSurface) {
    entries.index = `${origin}/ui@${currentUiRef}/index.js`;
  }
  if (hasUiMapboxSurface) {
    entries['ui-mapbox'] = `${origin}/ui-mapbox@${currentUiMapboxRef}/index.js`;
  }
  if (currentJsToolkit !== null) {
    entries['js-toolkit'] = `${origin}/js-toolkit@${currentJsToolkit}/index.js`;
  }

  return {
    packages: {
      ui: {
        releases: ui ? [...ui.releases] : [],
        channels: ui ? [...ui.channels] : [],
        distTags: ui ? { ...ui.distTags } : {},
      },
      'ui-mapbox': {
        releases: uiMapbox ? [...uiMapbox.releases] : [],
        channels: uiMapbox ? [...uiMapbox.channels] : [],
        distTags: uiMapbox ? { ...uiMapbox.distTags } : {},
      },
      'ui-autoload': {
        releases: uiAutoload ? [...uiAutoload.releases] : [],
        channels: uiAutoload ? [...uiAutoload.channels] : [],
        distTags: uiAutoload ? { ...uiAutoload.distTags } : {},
      },
      'js-toolkit': {
        releases: jsToolkit ? [...jsToolkit.releases] : [],
      },
    },
    current: {
      ui: currentUiRef,
      'ui-mapbox': currentUiMapboxRef,
      'ui-autoload': currentUiAutoloadRef,
      'js-toolkit': currentJsToolkit,
    },
    entries,
    components,
  };
}
