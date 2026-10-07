import { historyPush } from '@studiometa/js-toolkit/utils/historyPush';
import { historyReplace } from '@studiometa/js-toolkit/utils/historyReplace';
import { getInstance } from '@studiometa/js-toolkit/getInstance';
import type { SwapMode } from '@studiometa/js-toolkit';
import type { FetchRequest, FetchResponseDetail } from './request.js';

/**
 * The plain data a history entry keeps under its `fetch` key, enough to
 * rebuild the request and the swap from the restored URL alone.
 *
 * `history.state` holds `{ ...otherKeys, fetch: RestoreRecipe }`: the keys of
 * other scripts are kept. The `requestInit` option is not stored, because a
 * value the browser cannot clone would make `pushState()` throw.
 */
export interface RestoreRecipe {
  /** The `config.name` of the class that wrote the entry. */
  component: string;

  /** The id of the element that wrote the entry, if it has one. */
  owner?: string;

  /** The regions to swap. */
  selector: string;

  /** The swap mode. `append` and `prepend` are stored as `replace`. */
  mode: SwapMode;

  /** The query parameters set on every request URL. */
  params: Record<string, string>;

  /** The absolute fixed endpoint, if the request used one. */
  src?: string;

  /** The `response` expression. */
  response: string;

  /** The headers from the `headers` option, the header refs and `requestInit.headers`. */
  headers: Record<string, string>;

  /** Whether the swap runs in a view transition. */
  viewTransition: boolean;

  /** Options that a subclass adds, such as the `partials` of `FetchShopifyPartial`. */
  [option: string]: unknown;
}

/** One request, as the page-wide navigation token sees it. */
export interface NavigationToken {
  /** Whether the request has ended: applied, failed or aborted. */
  settled: boolean;

  /** Settles once the request has ended and emitted its final event. */
  finished: Promise<void>;

  /**
   * Stop the request with its final events, unless it has ended, has started
   * its DOM change or has failed.
   */
  supersede(reason?: unknown): void;
}

/** What the coordinator needs from an instance to restore an entry. */
interface HistoryOwner {
  readonly $isMounted: boolean;
  __restore(url: URL, recipe: RestoreRecipe): Promise<unknown>;
}

/** A `Fetch` class or subclass. */
export type HistoryOwnerConstructor = new (element: HTMLElement) => HistoryOwner;

const owners = new Map<string, HistoryOwnerConstructor>();

/** The navigation in flight, page-wide. */
let navigation: NavigationToken | undefined;

let isListening = false;

/**
 * The actions the coordinator takes on the page, as an object so a spec can
 * replace the reload that would take the test runner with it.
 *
 * @internal
 */
export const historyCoordinator = {
  reload(): void {
    window.location.reload();
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The keys other scripts hold in the current entry. */
function currentState(): Record<string, unknown> {
  return isRecord(window.history.state) ? window.history.state : {};
}

/**
 * Restore the entry the browser moved to.
 *
 * An entry without a `fetch` key belongs to another script and is ignored. A
 * live owner runs the restore, so its events and loading states apply. With
 * no live owner, a detached instance of the registered class runs it, and
 * its events reach `document`.
 */
function onPopstate(): void {
  const recipe = currentState().fetch;

  if (!isRecord(recipe) || typeof recipe.component !== 'string') {
    return;
  }

  const Owner = owners.get(recipe.component);

  // The URL has changed and nothing on this page can rebuild the content
  // for it. A reload keeps the address bar and the content in agreement.
  if (!Owner) {
    historyCoordinator.reload();
    return;
  }

  const element = typeof recipe.owner === 'string' ? document.getElementById(recipe.owner) : null;
  const live: unknown = element ? getInstance(element, recipe.component) : null;
  const instance =
    live instanceof Owner && live.$isMounted ? live : new Owner(document.createElement('div'));

  void instance.__restore(new URL(window.location.href), recipe as RestoreRecipe);
}

/**
 * Register a class that can restore its own entries under its `config.name`,
 * and install the single `popstate` listener of the page.
 */
export function registerHistoryOwner(name: string, Owner: HistoryOwnerConstructor): void {
  owners.set(name, Owner);

  if (!isListening) {
    window.addEventListener('popstate', onPopstate);
    isListening = true;
  }
}

/**
 * Make `token` the navigation in flight, page-wide. The previous navigation
 * is superseded: it ends with `fetch-abort` and `fetch-after`.
 */
export function claimNavigation(token: NavigationToken): void {
  const previous = navigation;
  navigation = token;

  if (previous && previous !== token) {
    previous.supersede();
  }
}

/** The navigation in flight, page-wide, if there is one. */
export function currentNavigation(): NavigationToken | undefined {
  return navigation;
}

/** Release the page-wide claim of `token`, if it still holds it. */
export function releaseNavigation(token: NavigationToken): void {
  if (navigation === token) {
    navigation = undefined;
  }
}

/**
 * The URL a request writes to history, or `undefined` when it writes none.
 *
 * - A GET writes its destination, with the hash of the destination.
 * - Another method writes the URL the server redirected to, as a GET entry,
 *   when the request used no `src`, without the `params` keys.
 * - A cross-origin URL is never written.
 */
export function entryUrl(
  request: Pick<FetchRequest, 'method' | 'destination'>,
  recipe: Pick<RestoreRecipe, 'params' | 'src'>,
  response?: FetchResponseDetail,
): URL | undefined {
  let url: URL | undefined;

  if (request.method === 'GET') {
    url = new URL(request.destination);
  } else if (response?.redirected && response.url && !recipe.src) {
    url = new URL(response.url);

    for (const name of Object.keys(recipe.params)) {
      url.searchParams.delete(name);
    }
  }

  return url && url.origin === window.location.origin ? url : undefined;
}

/**
 * Write the entry of a navigation and return whether one was written.
 *
 * A push of a GET to the URL the page already shows replaces the current
 * entry, as a native navigation does. Before the first push, the current
 * entry is stamped with the same recipe, so back to the page as first loaded
 * finds a recipe too.
 */
export function writeEntry(
  mode: 'push' | 'replace',
  request: Pick<FetchRequest, 'method' | 'destination'>,
  recipe: RestoreRecipe,
  response?: FetchResponseDetail,
): boolean {
  const url = entryUrl(request, recipe, response);

  if (!url) {
    return false;
  }

  const parts = { path: url.pathname, search: url.searchParams, hash: url.hash };
  const isPush =
    mode === 'push' && !(request.method === 'GET' && url.href === window.location.href);

  if (isPush && !isRecord(currentState().fetch)) {
    window.history.replaceState({ ...currentState(), fetch: recipe }, '', window.location.href);
  }

  const write = isPush ? historyPush : historyReplace;
  write(parts, { ...currentState(), fetch: recipe });

  return true;
}

/**
 * Forget the registered classes and the navigation in flight, and remove the
 * `popstate` listener. For specs only.
 *
 * @internal
 */
export function resetHistoryCoordinator(): void {
  window.removeEventListener('popstate', onPopstate);
  isListening = false;
  owners.clear();
  navigation = undefined;
}
