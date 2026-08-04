import type { CanonicalQuery, PackageName, ParsedRoute } from './types.ts';

const PACKAGE_NAMES: ReadonlySet<PackageName> = new Set(['ui', 'js-toolkit']);

const VERSION_TOKEN_PATTERN = /^[0-9A-Za-z.+-]+$/;
const ASSET_SEGMENT_PATTERN = /^[0-9A-Za-z._@+-]+$/;
const COMPONENT_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;

export class RequestValidationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 = 400,
  ) {
    super(message);
  }
}

export function parseRoute(pathname: string): ParsedRoute {
  try {
    decodeURIComponent(pathname);
  } catch {
    throw new RequestValidationError('Malformed path encoding.');
  }
  if (pathname.includes('%') || pathname.includes('\\')) {
    throw new RequestValidationError('Encoded or backslash path separators are not allowed.');
  }

  const segments = pathname.split('/');
  if (
    segments[0] !== '' ||
    segments.length < 3 ||
    segments.some((segment, index) => index > 0 && !segment)
  ) {
    throw new RequestValidationError('The CDN path is malformed.');
  }
  const packageSegment = segments[1];
  const separator = packageSegment.indexOf('@');
  const packageName = separator === -1 ? packageSegment : packageSegment.slice(0, separator);
  if (!PACKAGE_NAMES.has(packageName as PackageName)) {
    throw new RequestValidationError('Unknown CDN package.', 404);
  }

  // A versionless package segment (e.g. /ui/autoload.js) resolves to `latest`, which redirects to
  // the exact version like the /ui@latest/ alias. For js-toolkit `latest` never resolves, so a
  // versionless js-toolkit request is a 404 — js-toolkit is exact-version only.
  const requestedVersion = separator === -1 ? 'latest' : packageSegment.slice(separator + 1);
  if (!requestedVersion || !VERSION_TOKEN_PATTERN.test(requestedVersion)) {
    throw new RequestValidationError('The CDN version is malformed.');
  }
  const assetSegments = segments.slice(2);
  if (
    assetSegments.some(
      (segment) => segment === '.' || segment === '..' || !ASSET_SEGMENT_PATTERN.test(segment),
    )
  ) {
    throw new RequestValidationError('The asset path is malformed.');
  }
  return {
    packageName: packageName as PackageName,
    requestedVersion,
    assetPath: assetSegments.join('/'),
  };
}

// A bare package root is the package name alone, with no version and no asset segment: `/ui`,
// `/ui/`, `/js-toolkit`, `/js-toolkit/`. It redirects to a usable latest asset (resolved by the
// caller). Anything with a version (`/ui@1.2.0`) or an asset (`/ui/autoload.js`) falls through to
// `parseRoute`, so this recognizes only the bare name.
export function parseBareRoot(pathname: string): PackageName | undefined {
  const name = (pathname.endsWith('/') ? pathname.slice(0, -1) : pathname).slice(1);
  if (name === '' || name.includes('/')) return undefined;
  return PACKAGE_NAMES.has(name as PackageName) ? (name as PackageName) : undefined;
}

export function canonicalizeQuery(
  url: URL,
  assetPath: string,
  availableComponents: ReadonlySet<string>,
): CanonicalQuery {
  if (assetPath !== 'autoload.js') {
    return { components: [], search: '', canonical: url.search === '' };
  }

  const requested: string[] = [];
  for (const value of url.searchParams.getAll('components')) {
    for (const component of value.split(',')) {
      if (!COMPONENT_PATTERN.test(component) || !availableComponents.has(component)) {
        throw new RequestValidationError(
          'The components query contains an unknown or malformed component.',
        );
      }
      requested.push(component);
    }
  }
  const components = [...new Set(requested)].sort((left, right) => left.localeCompare(right));
  if (components.length > 20) {
    throw new RequestValidationError('At most 20 eager components may be requested.');
  }
  const search = components.length > 0 ? `?components=${components.join(',')}` : '';
  return { components, search, canonical: url.search === search };
}
