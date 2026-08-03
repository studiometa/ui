export interface R2ObjectBodyLike {
  body: ReadableStream<Uint8Array> | ArrayBuffer | string;
  etag?: string;
  httpEtag?: string;
  text(): Promise<string>;
}

export interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>;
}

export interface WorkerEnvironment {
  ASSETS: R2BucketLike;
}

export interface VersionsIndex {
  schemaVersion: 1;
  releases: string[];
  channels: string[];
  distTags: {
    latest: string;
    next: string;
    main: string;
  };
}

export interface BuildGraph {
  path?: string;
  entry?: string;
  preload: string[];
}

export interface BuildComponent extends BuildGraph {
  strategy: string;
}

export interface BuildMetadata {
  schemaVersion: 1;
  package: {
    name: string;
    version: string;
  };
  entries: Record<string, BuildGraph>;
  components: Record<string, BuildComponent>;
  outputs: Record<string, unknown>;
  releaseGates?: {
    publicMapboxRedistributionReview?: unknown;
  };
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
  requestedVersion: string;
  assetPath: string;
}

export interface CanonicalQuery {
  components: string[];
  search: string;
  canonical: boolean;
}
