import type { BuildMetadata, RegistryComponent, RegistryDocument, VersionsIndex } from './types.ts';

export interface RegistryInput {
  /** Absolute origin the registry builds its URLs from (e.g. `https://cdn.studiometa.dev`). */
  origin: string;
  /** The parsed versions index, or `undefined` when it could not be read or validated. */
  versions?: VersionsIndex;
  /** The reference reported as the current ui surface, resolved from the index. */
  currentUiRef: string | null;
  /** The version reported as the current js-toolkit surface, resolved from the index. */
  currentJsToolkit: string | null;
  /** The current ui ref's build metadata, or `undefined` when it is absent or unreadable. */
  currentUiBuild?: BuildMetadata;
}

/**
 * Builds the JSON registry served at the CDN root from already-read index and metadata. Everything
 * here is pure: I/O and its failure handling stay in the Worker handler, so the builder degrades to
 * empty inventories, null `current` values, and no component/entry URLs whenever an input is
 * missing rather than throwing.
 */
export function buildRegistry(input: RegistryInput): RegistryDocument {
  const { origin, versions, currentUiRef, currentJsToolkit, currentUiBuild } = input;
  const ui = versions?.packages.ui;
  const jsToolkit = versions?.packages['js-toolkit'];

  // Component subpath entries live at the ui tree root, so both ui and ui-mapbox components import
  // from a `/ui@<ref>/<subpath>.js` URL; only the owning package name distinguishes them.
  const hasUiSurface = currentUiRef !== null && currentUiBuild !== undefined;
  const components: RegistryComponent[] =
    hasUiSurface && currentUiBuild
      ? Object.entries(currentUiBuild.components)
          .map(([token, component]) => ({
            token,
            package: component.packageName,
            url: `${origin}/ui@${currentUiRef}/${component.subpath}.js`,
          }))
          .sort((left, right) => left.token.localeCompare(right.token))
      : [];

  const entries: Record<string, string> = {};
  if (hasUiSurface) {
    entries.autoload = `${origin}/ui@${currentUiRef}/autoload.js`;
    entries.index = `${origin}/ui@${currentUiRef}/index.js`;
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
      'js-toolkit': {
        releases: jsToolkit ? [...jsToolkit.releases] : [],
      },
    },
    current: {
      ui: currentUiRef,
      'js-toolkit': currentJsToolkit,
    },
    entries,
    components,
  };
}
