export interface R2ObjectBodyLike {
  body: ReadableStream<Uint8Array> | ArrayBuffer | string;
  etag?: string;
  httpEtag?: string;
  text(): Promise<string>;
}

export interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>;
}

export interface AnalyticsDatasetLike {
  writeDataPoint(event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

export interface WorkerEnvironment {
  ASSETS: R2BucketLike;
  /** Optional Cloudflare Analytics Engine binding; absent locally and in tests. */
  ANALYTICS?: AnalyticsDatasetLike;
  /** Optional 0..1 fraction of requests that also emit a structured console log line. */
  OBSERVABILITY_SAMPLE_RATE?: string;
}

export type PackageName = 'ui' | 'ui-mapbox' | 'js-toolkit';

export interface UiPackageIndex {
  releases: string[];
  channels: string[];
  distTags: {
    latest?: string;
    next?: string;
    main?: string;
  };
}

export interface JsToolkitPackageIndex {
  releases: string[];
}

export interface VersionsIndex {
  schemaVersion: 2;
  packages: {
    ui: UiPackageIndex;
    // `ui-mapbox` is an additive, optional package under schema 2, versioned in lockstep with `ui`
    // and carrying the same full ui semantics (releases, immutable channels and distribution tags).
    // An index predating the ui-mapbox tree omits it; the Worker defaults it to an empty package on
    // read, so this key is always populated on the parsed index.
    'ui-mapbox': UiPackageIndex;
    'js-toolkit': JsToolkitPackageIndex;
  };
}

export interface BuildGraph {
  path?: string;
  entry?: string;
  preload: string[];
}

export interface BuildComponent extends BuildGraph {
  strategy: string;
  packageName: string;
  subpath: string;
}

export interface BuildMetadata {
  schemaVersion: 1;
  package: {
    name: string;
    version: string;
  };
  dependencies?: Record<string, string>;
  entries: Record<string, BuildGraph>;
  components: Record<string, BuildComponent>;
  outputs: Record<string, unknown>;
  releaseGates?: Record<string, unknown>;
}

export interface IntegrityMetadata {
  schemaVersion: 1;
  algorithm: 'sha384';
  excludes: string[];
  files: Record<string, string>;
}

export type ExactVersion =
  | { kind: 'release'; version: string; objectPrefix: string }
  | { kind: 'channel'; version: string; objectPrefix: string };

export interface ParsedRoute {
  packageName: PackageName;
  requestedVersion: string;
  // True when the package segment carried no `@version` (e.g. `/ui/Action`). A versionless request
  // resolves its version the same way a bare package root does — via `resolveBareRoot` — so it works
  // for every package including the tagless `js-toolkit`, then redirects to the resolved exact
  // version. `requestedVersion` stays `latest` so the request always canonicalizes to a redirect.
  versionless: boolean;
  assetPath: string;
}

export interface CanonicalQuery {
  components: string[];
  search: string;
  canonical: boolean;
}

export interface RegistryComponent {
  token: string;
  package: string;
  url: string;
}

export interface RegistryUiPackage {
  releases: string[];
  channels: string[];
  distTags: {
    latest?: string;
    next?: string;
    main?: string;
  };
}

export interface RegistryDocument {
  packages: {
    ui: RegistryUiPackage;
    'ui-mapbox': RegistryUiPackage;
    'js-toolkit': {
      releases: string[];
    };
  };
  current: {
    ui: string | null;
    'ui-mapbox': string | null;
    'js-toolkit': string | null;
  };
  entries: Record<string, string>;
  components: RegistryComponent[];
}
