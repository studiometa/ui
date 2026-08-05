import type { CanonicalQuery, PackageName, PackageRoot, ParsedRoute } from './types.ts';

const PACKAGE_NAMES: ReadonlySet<PackageName> = new Set(['ui', 'ui-mapbox', 'js-toolkit']);

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

  // A versionless package segment (e.g. `/ui/Action`, `/js-toolkit/utils`) has no `@version`; the
  // caller resolves it the same way a bare package root does (via `resolveBareRoot`) so it works for
  // every package — `ui`/`ui-mapbox` follow their `latest` tag and the tagless `js-toolkit` its
  // highest release — then redirects to the resolved exact version. `requestedVersion` stays `latest`
  // so the request always classifies as mutable and canonicalizes to that redirect.
  const versionless = separator === -1;
  const requestedVersion = versionless ? 'latest' : packageSegment.slice(separator + 1);
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
    versionless,
    assetPath: assetSegments.join('/'),
  };
}

// A package root is a single path segment naming a package, with an optional `@<ref>` and no asset
// segment: the bare `/ui`, `/ui/`, `/js-toolkit`, and the ref-carrying `/ui@next`, `/ui@1.2.0/`,
// `/ui@main`. The caller redirects it to the resolved exact version's `index.js` barrel — the bare
// form via the package default (`resolveBareRoot`), a ref via the full `/ui@<ref>/` semantics
// (`resolveVersion`). Anything with an asset segment (`/ui/autoload.js`, `/ui@next/Action`) has more
// than one segment and falls through to `parseRoute`. The ref, when present, is validated with the
// same token pattern asset routes use; a malformed ref (or a `%`/`\` in it) yields `undefined` so
// `parseRoute` rejects it consistently.
export function parsePackageRoot(pathname: string): PackageRoot | undefined {
  const segment = (pathname.endsWith('/') ? pathname.slice(0, -1) : pathname).slice(1);
  if (segment === '' || segment.includes('/')) return undefined;
  const separator = segment.indexOf('@');
  const packageName = separator === -1 ? segment : segment.slice(0, separator);
  if (!PACKAGE_NAMES.has(packageName as PackageName)) return undefined;
  if (separator === -1) return { packageName: packageName as PackageName };
  const ref = segment.slice(separator + 1);
  if (!ref || !VERSION_TOKEN_PATTERN.test(ref)) return undefined;
  return { packageName: packageName as PackageName, ref };
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
