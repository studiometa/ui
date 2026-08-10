import type { ComponentLoadStrategy } from '@studiometa/js-toolkit';

/**
 * Authoring types for the component manifest generator (`scripts/generate-manifests.ts`).
 *
 * The runtime manifest types (`ComponentManifest`, `ComponentManifestEntry`,
 * `ComponentLoadStrategy`) now live in `@studiometa/js-toolkit`. These two authoring types are
 * repository-local tooling contracts: they describe the hand-authored catalogs the generator reads
 * (`packages/ui/catalog.ts`, `packages/ui-mapbox/src/catalog.ts`), never a published runtime surface.
 */

/**
 * Curated authoring metadata for a single component, consumed by the manifest generator. The
 * `subpath` and `exportName` default to the `token` when omitted.
 */
export interface CuratedComponentMetadata {
  token: string;
  group: string;
  children?: readonly string[];
  styles?: readonly string[];
  integrations?: readonly string[];
  subpath?: string;
  exportName?: string;
}

/**
 * The authoring catalog for a component package: the list of its components, the default strategy
 * they share, and the abstract exports that are intentionally excluded from the manifest.
 */
export interface ComponentCatalog {
  packageName: string;
  strategy: ComponentLoadStrategy;
  components: readonly CuratedComponentMetadata[];
  abstractExports: readonly string[];
}
