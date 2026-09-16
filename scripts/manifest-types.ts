import type { MountStrategy } from '@studiometa/js-toolkit';

/**
 * Authoring types for the component manifest generator (`scripts/generate-manifests.ts`).
 *
 * The runtime manifest types (`ComponentManifest`, `ComponentManifestEntry`,
 * `MountStrategy`) now live in `@studiometa/js-toolkit`. These two authoring types are
 * repository-local tooling contracts: they describe the hand-authored catalogs the generator reads
 * (`packages/ui/catalog.ts`, `packages/ui-mapbox/src/catalog.ts`), never a published runtime surface.
 */

/**
 * Curated authoring metadata for a single component, consumed by the manifest generator. The
 * `subpath` and `exportName` default to the `token` when omitted, and `strategy` defaults to the
 * one the catalog declares for the whole package.
 */
export interface CuratedComponentMetadata {
  token: string;
  group: string;
  children?: readonly string[];
  styles?: readonly string[];
  integrations?: readonly string[];
  subpath?: string;
  exportName?: string;
  strategy?: MountStrategy;
}

/**
 * The authoring catalog for a component package: the list of its components, the default strategy
 * a component inherits when it declares none of its own, and the abstract exports that are
 * intentionally excluded from the manifest.
 */
export interface ComponentCatalog {
  packageName: string;
  strategy: MountStrategy;
  components: readonly CuratedComponentMetadata[];
  abstractExports: readonly string[];
}
