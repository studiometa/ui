import {
  computeSha384,
  type ObjectStore,
  type PutObjectOptions,
} from '../scripts/lib/object-store.ts';
import type { Artifact, PublishBuildMetadata } from '../scripts/lib/publication.ts';
import type { WorkingVersionsIndex } from '../scripts/lib/versions.ts';

export interface RecordedOperation {
  op: 'head' | 'get' | 'put' | 'copy' | 'delete';
  key: string;
}

interface MemoryObject {
  body: Uint8Array;
  sha384: string;
}

/**
 * In-memory {@link ObjectStore} double mirroring the Worker test's MemoryR2. It records every
 * operation in order and supports fault injection so interrupted uploads and corrupted read-backs
 * can be exercised without any network access.
 */
export class MemoryObjectStore implements ObjectStore {
  readonly objects = new Map<string, MemoryObject>();
  readonly operations: RecordedOperation[] = [];
  /** Keys whose `put` throws, simulating an interrupted upload. */
  readonly putFailures = new Set<string>();
  /** Keys stored with a deliberately wrong digest, simulating a corrupted upload. */
  readonly corruptKeys = new Set<string>();

  async head(key: string): Promise<{ size: number; sha384?: string } | undefined> {
    this.operations.push({ op: 'head', key });
    const object = this.objects.get(key);
    return object ? { size: object.body.length, sha384: object.sha384 } : undefined;
  }

  async getText(key: string): Promise<string | undefined> {
    this.operations.push({ op: 'get', key });
    const object = this.objects.get(key);
    return object ? Buffer.from(object.body).toString('utf8') : undefined;
  }

  async put(key: string, body: Uint8Array, _options: PutObjectOptions): Promise<void> {
    this.operations.push({ op: 'put', key });
    if (this.putFailures.has(key)) throw new Error(`Injected upload failure for ${key}.`);
    const sha384 = this.corruptKeys.has(key) ? 'sha384-corrupted' : computeSha384(body);
    this.objects.set(key, { body: new Uint8Array(body), sha384 });
  }

  async copy(sourceKey: string, targetKey: string): Promise<void> {
    this.operations.push({ op: 'copy', key: targetKey });
    const source = this.objects.get(sourceKey);
    if (!source) throw new Error(`Copy source is missing: ${sourceKey}.`);
    const sha384 = this.corruptKeys.has(targetKey) ? 'sha384-corrupted' : source.sha384;
    this.objects.set(targetKey, { body: source.body, sha384 });
  }

  async delete(key: string): Promise<void> {
    this.operations.push({ op: 'delete', key });
    this.objects.delete(key);
  }

  keysWithPrefix(prefix: string): string[] {
    return [...this.objects.keys()].filter((key) => key.startsWith(prefix)).sort();
  }

  indexOfPut(key: string): number {
    return this.operations.findIndex((entry) => entry.op === 'put' && entry.key === key);
  }
}

export interface ArtifactOverrides {
  version?: string;
  commit?: string;
  clean?: boolean;
  publishable?: boolean;
  gateStatus?: string;
}

function artifactFile(path: string, contents: string) {
  const body = new Uint8Array(Buffer.from(contents, 'utf8'));
  return { path, body, sha384: computeSha384(body) };
}

/** Builds a small but structurally faithful in-memory artifact for publication tests. */
export function makeArtifact(overrides: ArtifactOverrides = {}): Artifact {
  const build: PublishBuildMetadata = {
    package: { name: '@studiometa/ui-cdn', version: overrides.version ?? '2.1.0' },
    build: {
      commit: overrides.commit ?? 'a'.repeat(40),
      clean: overrides.clean ?? true,
      publishable: overrides.publishable ?? true,
    },
    releaseGates: {
      publicMapboxRedistributionReview: {
        required: true,
        status: overrides.gateStatus ?? 'approved',
        blocksPublicRelease: true,
      },
    },
  };
  const files = [
    artifactFile('autoload.js', 'export const cdn = 1;\n//# sourceMappingURL=autoload.js.map\n'),
    artifactFile('autoload.js.map', '{"version":3,"sources":[],"mappings":""}'),
    artifactFile('build.json', JSON.stringify(build)),
    artifactFile('integrity.json', '{"schemaVersion":1,"algorithm":"sha384","files":{}}'),
  ];
  return { files, build };
}

export function seedVersionsIndex(store: MemoryObjectStore, index: WorkingVersionsIndex): void {
  const body = new Uint8Array(Buffer.from(JSON.stringify(index), 'utf8'));
  store.objects.set('versions.json', { body, sha384: computeSha384(body) });
}
