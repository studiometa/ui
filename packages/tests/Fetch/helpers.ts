import { afterEach, beforeEach, vi } from 'vitest';
import { getInstance } from '@studiometa/js-toolkit';
import { mount, recordEvents, resetDom } from '@studiometa/js-toolkit/test';
import { FETCH_EVENTS, type Fetch } from '#private/Fetch/Fetch.js';
import { resetHistoryCoordinator } from '#private/Fetch/history.js';

const originalFetch = window.fetch;
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;
const originalHref = window.location.href;
const originalTitle = document.title;

/** Real navigation would take the test runner with it. */
function preventNavigation(event: Event): void {
  event.preventDefault();
}

/**
 * Install the hooks every Fetch spec needs: no real navigation, and a clean
 * client, history entry, title and coordinator after each test.
 */
export function useFetchSpecHooks(): void {
  beforeEach(() => {
    document.addEventListener('click', preventNavigation, true);
    document.addEventListener('submit', preventNavigation, true);
  });

  afterEach(async () => {
    document.removeEventListener('click', preventNavigation, true);
    document.removeEventListener('submit', preventNavigation, true);
    window.fetch = originalFetch;
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    resetHistoryCoordinator();
    window.history.replaceState(null, '', originalHref);
    document.title = originalTitle;
    await resetDom();
  });
}

/**
 * Let submissions reach the browser for the rest of the test, for a form
 * whose native default does not navigate, such as `method="dialog"`.
 */
export function allowNativeSubmit(): void {
  document.removeEventListener('submit', preventNavigation, true);
}

/**
 * Record the URLs written with `pushState()` and `replaceState()` from now on.
 *
 * `history.length` cannot tell: the browser caps it, and a spec that went
 * back leaves forward entries that the next push drops.
 */
export function recordHistoryWrites(): { pushed: string[]; replaced: string[] } {
  const pushed: string[] = [];
  const replaced: string[] = [];
  window.history.pushState = function pushState(data, unused, url) {
    pushed.push(new URL(String(url), window.location.href).href);
    originalPushState.call(window.history, data, unused, url);
  };
  window.history.replaceState = function replaceState(data, unused, url) {
    replaced.push(new URL(String(url), window.location.href).href);
    originalReplaceState.call(window.history, data, unused, url);
  };
  return { pushed, replaced };
}

/** Resolve a path against the page, the way the component does. */
export function abs(path: string): string {
  return new URL(path, window.location.href).href;
}

/** Mount one `Fetch` (or subclass) from markup and hand back the instance. */
export async function mountFetch<T extends Fetch = Fetch>(
  html: string,
  name = 'Fetch',
): Promise<{ root: HTMLElement; el: HTMLElement; instance: T }> {
  const root = await mount(html);
  const el = root.querySelector<HTMLElement>(`[data-component~="${name}"]`)!;
  return { root, el, instance: getInstance<T>(el, name)! };
}

type Client = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

let currentClient: Client = originalFetch;

/**
 * The one function installed as `window.fetch`. An instance keeps the client
 * it first used, so a spec that changes the stub halfway through still
 * reaches the new one through this function.
 */
function dispatchFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return currentClient(input, init);
}

/** Make `client` the stub every instance reaches. */
function installClient(client: Client): void {
  currentClient = client;
  window.fetch = dispatchFetch as typeof fetch;
}

/** One call the stubbed client received. */
export interface ClientCall {
  url: string;
  init: RequestInit;
}

/** Replace `window.fetch` and record every call. */
export function stubClient(
  // An id no spec renders, so a request left in flight by one spec cannot
  // land in the next one's DOM.
  respond: (url: string, init: RequestInit) => Response | Promise<Response> = () =>
    new Response('<div id="fetch-default">new</div>'),
): { calls: ClientCall[]; spy: ReturnType<typeof vi.fn> } {
  const calls: ClientCall[] = [];
  const spy = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    return respond(String(input), init);
  });
  installClient(spy as unknown as Client);
  return { calls, spy };
}

/** A pending call of {@link deferClient}, settled by the test. */
export interface DeferredCall extends ClientCall {
  resolve(response: Response): void;
  reject(error: unknown): void;
}

/**
 * Replace `window.fetch` with a client whose responses the test releases one
 * by one. By default the client follows the abort signal, as `window.fetch`
 * does; `followSignal: false` gives a client that ignores it.
 */
export function deferClient({ followSignal = true } = {}): { calls: DeferredCall[] } {
  const calls: DeferredCall[] = [];
  installClient(
    (input: RequestInfo | URL, init: RequestInit = {}) =>
      new Promise<Response>((resolve, reject) => {
        calls.push({ url: String(input), init, resolve, reject });
        if (followSignal) {
          init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }
      }),
  );
  return { calls };
}

/** Build a response that reports a redirect, as `fetch()` gives one. */
export function redirectedResponse(body: string, url: string): Response {
  const response = new Response(body);
  Object.defineProperty(response, 'redirected', { value: true });
  Object.defineProperty(response, 'url', { value: url });
  return response;
}

/** Record every lifecycle event that reaches `target`, in order. */
export function recordFetchEvents(target: EventTarget): ReturnType<typeof recordEvents> {
  return recordEvents(target, ...Object.values(FETCH_EVENTS));
}

/** The types of the recorded events, in order. */
export function types(events: { type: string }[]): string[] {
  return events.map(({ type }) => type);
}

/** The detail of the first recorded event of the given type. */
export function detailOf<D = Record<string, unknown>>(
  events: { type: string; detail: unknown }[],
  type: string,
): D {
  const event = events.find((candidate) => candidate.type === type);
  if (!event) {
    throw new Error(`No ${type} event was recorded.`);
  }
  return event.detail as D;
}

/** Go back one entry and wait for the browser to report it. */
export function back(): Promise<void> {
  return new Promise((resolve) => {
    window.addEventListener('popstate', () => resolve(), { once: true });
    window.history.back();
  });
}

/** Go forward one entry and wait for the browser to report it. */
export function forward(): Promise<void> {
  return new Promise((resolve) => {
    window.addEventListener('popstate', () => resolve(), { once: true });
    window.history.forward();
  });
}

/** Take over `document.startViewTransition` and count the calls. */
export function stubViewTransition(): { spy: ReturnType<typeof vi.fn>; restore: () => void } {
  const original = document.startViewTransition;
  const spy = vi.fn((callback: () => void | Promise<void>) => {
    const finished = Promise.resolve(callback()).then(() => undefined);
    return { ready: finished, finished, updateCallbackDone: finished, skipTransition() {} };
  });
  Object.defineProperty(document, 'startViewTransition', { value: spy, configurable: true });
  return {
    spy,
    restore() {
      if (original) {
        Object.defineProperty(document, 'startViewTransition', {
          value: original,
          configurable: true,
        });
      } else {
        delete (document as { startViewTransition?: unknown }).startViewTransition;
      }
    },
  };
}
