import type { ExactVersion } from './types.ts';

export type RouteKind = 'asset' | 'registry' | 'preflight' | 'method-not-allowed';
export type VersionKind = 'exact-release' | 'exact-channel' | 'dist-tag' | 'major-alias' | 'none';
export type R2Operation = 'index' | 'release-metadata' | 'asset';
export type R2Result = 'hit' | 'miss';
export type ErrorCode =
  | 'ok'
  | 'redirect'
  | 'invalid-request'
  | 'not-found'
  | 'method-not-allowed'
  | 'storage-unavailable';

export interface RequestObservation {
  status: number;
  routeKind: RouteKind;
  versionKind: VersionKind;
  componentCount: number;
  r2Operation?: R2Operation;
  r2Result?: R2Result;
  errorCode: ErrorCode;
  sampled: boolean;
}

/**
 * Minimal shape of a Cloudflare Analytics Engine dataset binding. It is optional so the Worker runs
 * locally and in tests without one.
 */
export interface AnalyticsDataset {
  writeDataPoint(event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

export interface ObservabilityEnvironment {
  ANALYTICS?: AnalyticsDataset;
  OBSERVABILITY_SAMPLE_RATE?: string;
}

const DIST_TAGS = new Set(['latest', 'next', 'main']);

function errorCodeForStatus(status: number): ErrorCode {
  if (status === 307) return 'redirect';
  if (status === 400) return 'invalid-request';
  if (status === 404) return 'not-found';
  if (status === 405) return 'method-not-allowed';
  if (status === 502) return 'storage-unavailable';
  return 'ok';
}

/**
 * Derives the version kind from the requested token and the resolved version without ever
 * retaining the raw token, so nothing user-controlled leaks into telemetry.
 */
export function classifyVersion(
  requestedVersion: string | undefined,
  resolved: ExactVersion | undefined,
): VersionKind {
  if (requestedVersion === undefined || resolved === undefined) return 'none';
  if (DIST_TAGS.has(requestedVersion)) return 'dist-tag';
  if (requestedVersion === resolved.version) {
    return resolved.kind === 'release' ? 'exact-release' : 'exact-channel';
  }
  return 'major-alias';
}

/**
 * Collects a privacy-preserving telemetry record over the lifetime of a request. Only derived
 * enums and counts are stored — never raw URLs, paths, or query values.
 */
export class ObservationRecorder {
  /** @private */
  __routeKind: RouteKind = 'asset';
  /** @private */
  __versionKind: VersionKind = 'none';
  /** @private */
  __componentCount = 0;
  /** @private */
  __r2Operation?: R2Operation;
  /** @private */
  __r2Result?: R2Result;

  /** Records the coarse route kind (asset request, CORS preflight, or rejected method). */
  routeKind(kind: RouteKind): void {
    this.__routeKind = kind;
  }

  /** Records the resolved version classification. */
  versionKind(kind: VersionKind): void {
    this.__versionKind = kind;
  }

  /** Records the count of canonical, validated eager components. */
  componentCount(count: number): void {
    this.__componentCount = count;
  }

  /** Records the most recent R2 access and whether the object was present. */
  r2(operation: R2Operation, result: R2Result): void {
    this.__r2Operation = operation;
    this.__r2Result = result;
  }

  /** Finalizes the record for the given response status and sampling decision. */
  finish(status: number, sampled: boolean): RequestObservation {
    return {
      status,
      routeKind: this.__routeKind,
      versionKind: this.__versionKind,
      componentCount: this.__componentCount,
      r2Operation: this.__r2Operation,
      r2Result: this.__r2Result,
      errorCode: errorCodeForStatus(status),
      sampled,
    };
  }
}

function sampleRate(environment: ObservabilityEnvironment): number {
  const raw = Number(environment.OBSERVABILITY_SAMPLE_RATE);
  if (!Number.isFinite(raw)) return 0;
  return Math.min(1, Math.max(0, raw));
}

/**
 * Emits a request observation. The Analytics Engine data point is always written when the binding
 * exists; a structured console line is emitted only for the sampled fraction. Emission never throws
 * into the request path and never records raw request URLs or query values.
 */
export function emitObservation(
  environment: ObservabilityEnvironment,
  recorder: ObservationRecorder,
  status: number,
): RequestObservation {
  const sampled = Math.random() < sampleRate(environment);
  const observation = recorder.finish(status, sampled);
  try {
    environment.ANALYTICS?.writeDataPoint({
      blobs: [
        observation.routeKind,
        observation.versionKind,
        observation.errorCode,
        observation.r2Operation ?? 'none',
        observation.r2Result ?? 'none',
      ],
      doubles: [observation.status, observation.componentCount],
      indexes: [observation.errorCode],
    });
    if (sampled) {
      console.log(
        JSON.stringify({
          message: 'cdn.request',
          status: observation.status,
          routeKind: observation.routeKind,
          versionKind: observation.versionKind,
          componentCount: observation.componentCount,
          r2Operation: observation.r2Operation ?? 'none',
          r2Result: observation.r2Result ?? 'none',
          errorCode: observation.errorCode,
        }),
      );
    }
  } catch {
    // Telemetry must never affect the response.
  }
  return observation;
}
