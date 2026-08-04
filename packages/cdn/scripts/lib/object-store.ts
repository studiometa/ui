import { createHash } from 'node:crypto';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

export interface StoredObjectHead {
  size: number;
  sha384?: string;
}

export interface PutObjectOptions {
  contentType: string;
  cacheControl: string;
  metadata: Record<string, string>;
}

/**
 * Minimal transport contract shared by the real Cloudflare R2 (S3 API) client and the in-memory
 * test double. The publication and rollback logic depends only on this interface so it can be
 * exercised without any network access.
 */
export interface ObjectStore {
  head(key: string): Promise<StoredObjectHead | undefined>;
  getText(key: string): Promise<string | undefined>;
  put(key: string, body: Uint8Array, options: PutObjectOptions): Promise<void>;
  copy(sourceKey: string, targetKey: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export function computeSha384(body: Uint8Array): string {
  return `sha384-${createHash('sha384').update(body).digest('base64')}`;
}

const SHA384_METADATA_KEY = 'studiometa-sha384';
const SIZE_METADATA_KEY = 'studiometa-size';

export function contentTypeForKey(key: string): string {
  if (key.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (key.endsWith('.css')) return 'text/css; charset=utf-8';
  if (key.endsWith('.json') || key.endsWith('.map')) return 'application/json; charset=utf-8';
  if (key.endsWith('.txt') || key.endsWith('.md') || /(?:^|\/)(?:LICENSE|COPYING)/.test(key)) {
    return 'text/plain; charset=utf-8';
  }
  return 'application/octet-stream';
}

export function cacheControlForKey(key: string): string {
  return key.startsWith('releases/') || key.startsWith('channels/')
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=300, s-maxage=3600';
}

export function objectMetadata(body: Uint8Array): PutObjectOptions {
  return {
    contentType: 'application/octet-stream',
    cacheControl: 'public, max-age=300',
    metadata: {
      [SHA384_METADATA_KEY]: computeSha384(body),
      [SIZE_METADATA_KEY]: String(body.length),
    },
  };
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (('name' in error && (error as { name: string }).name === 'NotFound') ||
      ('$metadata' in error &&
        (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404))
  );
}

async function streamToString(body: unknown): Promise<string> {
  if (typeof body === 'string') return body;
  if (body && typeof (body as { transformToString?: unknown }).transformToString === 'function') {
    return (body as { transformToString(): Promise<string> }).transformToString();
  }
  throw new Error('Unsupported object body stream.');
}

/**
 * Cloudflare R2 transport implemented against the S3-compatible API. Credentials are supplied by
 * the caller and are never logged. Object keys are treated as opaque; nothing derived from a key
 * is emitted to logs by this module.
 */
export class S3ObjectStore implements ObjectStore {
  /** @private */
  __client: S3Client;
  /** @private */
  __bucket: string;

  constructor(client: S3Client, bucket: string) {
    this.__client = client;
    this.__bucket = bucket;
  }

  async head(key: string): Promise<StoredObjectHead | undefined> {
    try {
      const response = await this.__client.send(
        new HeadObjectCommand({ Bucket: this.__bucket, Key: key }),
      );
      return {
        size: response.ContentLength ?? 0,
        sha384: response.Metadata?.[SHA384_METADATA_KEY],
      };
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  }

  async getText(key: string): Promise<string | undefined> {
    try {
      const response = await this.__client.send(
        new GetObjectCommand({ Bucket: this.__bucket, Key: key }),
      );
      return await streamToString(response.Body);
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  }

  async put(key: string, body: Uint8Array, options: PutObjectOptions): Promise<void> {
    await this.__client.send(
      new PutObjectCommand({
        Bucket: this.__bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        CacheControl: options.cacheControl,
        Metadata: options.metadata,
      }),
    );
  }

  async copy(sourceKey: string, targetKey: string): Promise<void> {
    await this.__client.send(
      new CopyObjectCommand({
        Bucket: this.__bucket,
        CopySource: `${this.__bucket}/${sourceKey}`,
        Key: targetKey,
        MetadataDirective: 'COPY',
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.__client.send(new DeleteObjectCommand({ Bucket: this.__bucket, Key: key }));
  }
}

export interface ObjectStoreConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Reads the scoped R2 credentials from the environment. Secrets are only read here and are never
 * echoed back or logged.
 */
export function loadObjectStoreConfig(environment: NodeJS.ProcessEnv): ObjectStoreConfig {
  const endpoint = environment.CDN_S3_ENDPOINT;
  const bucket = environment.CDN_S3_BUCKET;
  const accessKeyId = environment.CDN_S3_ACCESS_KEY_ID;
  const secretAccessKey = environment.CDN_S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing required environment variables: CDN_S3_ENDPOINT, CDN_S3_BUCKET, CDN_S3_ACCESS_KEY_ID, CDN_S3_SECRET_ACCESS_KEY.',
    );
  }
  return { endpoint, bucket, accessKeyId, secretAccessKey };
}

export function createS3ObjectStore(config: ObjectStoreConfig): S3ObjectStore {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: 'auto',
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return new S3ObjectStore(client, config.bucket);
}
