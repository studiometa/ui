/**
 * Pure helpers that build the request of a `Fetch` navigation.
 *
 * Nothing here reads the instance or the page state other than through its
 * arguments, so every rule can be checked without a component.
 */

/**
 * The plain description of one request.
 *
 * `Fetch` builds it from the element, the options and, on back or forward
 * navigation, the restored URL. It travels in `fetch-before`, where
 * a listener can change `url`, `headers`, `body` and `history` before the
 * request is sent.
 */
export interface FetchRequest {
  /** The absolute URL that is requested. */
  url: string;

  /** The absolute URL the address bar shows, and the one back restores. */
  destination: string;

  /** The HTTP method, upper case. */
  method: string;

  /** The request headers, with lower-case names. */
  headers: Record<string, string>;

  /** The request body, for a method other than GET. */
  body?: FormData | URLSearchParams | string;

  /** How the request writes history, or `false` when it does not. */
  history: 'push' | 'replace' | false;
}

/**
 * The plain description of a response, without its body.
 *
 * A body reads once and `Fetch` reads it, so the `Response` itself is never
 * given to listeners.
 */
export interface FetchResponseDetail {
  /** The final URL, after redirects. */
  url: string;
  status: number;
  statusText: string;
  ok: boolean;
  redirected: boolean;

  /** The response headers, with lower-case names. */
  headers: Record<string, string>;
}

/** The options that derive the request URL from a destination. */
export interface RequestUrlOptions {
  /** A fixed endpoint: it gives the origin and the path, and its own query is kept. */
  src?: string;

  /** Query parameters set last on every request URL, so they win. */
  params?: Record<string, string>;

  /**
   * Fold the query of the destination over the query of `src`. Only a link, a
   * form or an explicit destination has a query of its own to fold.
   */
  fold: boolean;
}

/**
 * Fold the entries of `source` over `target`.
 *
 * The first value of a name deletes the values `target` holds for it, and
 * every value then appends, so a repeated name (a checkbox group, a
 * `<select multiple>`) keeps all its values.
 */
export function foldQuery(target: URLSearchParams, source: URLSearchParams): void {
  const overridden = new Set<string>();

  for (const [name, value] of source) {
    if (!overridden.has(name)) {
      target.delete(name);
      overridden.add(name);
    }

    target.append(name, value);
  }
}

/**
 * Derive the URL to request from a destination.
 *
 * - Without `src`, the request URL is the destination.
 * - With `src`, the origin, the path and the query of `src` are used, and the
 *   query of the destination is folded on when `fold` is set.
 * - `params` are set last and win over both.
 */
export function requestUrl(destination: URL, { src, params = {}, fold }: RequestUrlOptions): URL {
  let url: URL;

  if (src) {
    url = new URL(src, destination);
    url.hash = '';

    if (fold) {
      foldQuery(url.searchParams, destination.searchParams);
    }
  } else {
    url = new URL(destination);
  }

  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }

  return url;
}

/**
 * Coerce a plain object to a record of strings.
 *
 * A JSON option gives numbers and booleans as such, and a URL takes strings.
 */
export function stringRecord(value: unknown): Record<string, string> {
  const record: Record<string, string> = {};

  if (value && typeof value === 'object') {
    for (const [name, item] of Object.entries(value)) {
      if (item !== undefined && item !== null) {
        record[name] = String(item);
      }
    }
  }

  return record;
}

/**
 * Read any `HeadersInit` form into a record with lower-case names.
 *
 * A `Headers` instance has no own keys and a list of tuples does not spread
 * into an object, so the three forms are read through the `Headers` iterator.
 */
export function headerRecord(headers: HeadersInit | undefined): Record<string, string> {
  const record: Record<string, string> = {};

  if (headers) {
    for (const [name, value] of new Headers(headers)) {
      record[name] = value;
    }
  }

  return record;
}

/** Describe a response as plain data, without reading its body. */
export function responseDetail(response: Response): FetchResponseDetail {
  const headers: Record<string, string> = {};

  for (const [name, value] of response.headers) {
    headers[name] = value;
  }

  return {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    redirected: response.redirected,
    headers,
  };
}
