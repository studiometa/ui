const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'If-None-Match',
  'Access-Control-Max-Age': '86400',
  'Cross-Origin-Resource-Policy': 'cross-origin',
} as const;

export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
export const MUTABLE_CACHE_CONTROL = 'public, max-age=300, s-maxage=3600';

export function responseHeaders(initial?: HeadersInit): Headers {
  const headers = new Headers(initial);
  for (const [name, value] of Object.entries(CORS_HEADERS)) headers.set(name, value);
  return headers;
}

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: responseHeaders() });
}

export function errorResponse(status: 400 | 404 | 405 | 502): Response {
  const messages = {
    400: 'Invalid CDN request.',
    404: 'CDN asset not found.',
    405: 'Method not allowed.',
    502: 'CDN storage unavailable.',
  } as const;
  const headers = responseHeaders({
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
  });
  if (status === 405) headers.set('Allow', 'GET, HEAD, OPTIONS');
  return new Response(messages[status], { status, headers });
}

export function redirectResponse(location: string): Response {
  return new Response(null, {
    status: 307,
    headers: responseHeaders({
      'Cache-Control': MUTABLE_CACHE_CONTROL,
      Location: location,
    }),
  });
}

export function contentType(assetPath: string): string {
  if (assetPath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (assetPath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (assetPath.endsWith('.json') || assetPath.endsWith('.map')) {
    return 'application/json; charset=utf-8';
  }
  if (
    assetPath.endsWith('.txt') ||
    assetPath.endsWith('.md') ||
    /(?:^|\/)(?:LICENSE|COPYING)(?:\.[^/]*)?$/.test(assetPath)
  ) {
    return 'text/plain; charset=utf-8';
  }
  return 'application/octet-stream';
}

function weakEtag(value: string): string {
  return value.trim().replace(/^W\//, '');
}

export function etagMatches(ifNoneMatch: string | null, etag: string | undefined): boolean {
  if (!ifNoneMatch || !etag) return false;
  return ifNoneMatch
    .split(',')
    .some((candidate) => candidate.trim() === '*' || weakEtag(candidate) === weakEtag(etag));
}
