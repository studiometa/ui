import { Base } from '@studiometa/js-toolkit/Base';
import { domUpdate } from '@studiometa/js-toolkit/domUpdate';
import { EVENTS } from '@studiometa/js-toolkit/EVENTS';
import { swap } from '@studiometa/js-toolkit/swap';
import { SWAP_MODES } from '@studiometa/js-toolkit/SWAP_MODES';
import { viewTransition } from '@studiometa/js-toolkit/viewTransition';
import type { BaseConfig, BaseProps, DomUpdateDetail, SwapMode } from '@studiometa/js-toolkit';
import { historyPush } from '@studiometa/js-toolkit/utils/historyPush';
import { historyReplace } from '@studiometa/js-toolkit/utils/historyReplace';
import { compileExpression } from '../utils/expression.js';

/**
 * The lifecycle events a `Fetch` announces.
 *
 * A module constant rather than a static, because a static only pays for
 * itself if a subclass replaces the map, and nothing here does.
 */
export const FETCH_EVENTS = Object.freeze({
  BEFORE_FETCH: 'fetch-before',
  FETCH: 'fetch-fetch',
  RESPONSE: 'fetch-response',
  AFTER_FETCH: 'fetch-after',
  BEFORE_UPDATE: 'fetch-update-before',
  UPDATE: 'fetch-update',
  AFTER_UPDATE: 'fetch-update-after',
  ERROR: 'fetch-error',
  ABORT: 'fetch-abort',
} as const);

/**
 * The header names the request carries on the component's own behalf.
 */
export const HEADER_NAMES = Object.freeze({
  ACCEPT: 'accept',
  X_REQUESTED_BY: 'x-requested-by',
  X_TRIGGERED_BY: 'x-triggered-by',
  USER_AGENT: 'user-agent',
} as const);

/**
 * Read a `RequestInit`'s headers without assuming which form they took.
 *
 * `HeadersInit` is a record, a list of tuples, or a `Headers` instance, and
 * only the record answers to indexing or spreading — a `Headers` has no own
 * enumerable keys at all. Everything below is built on this one reader, and it
 * is allocation-light and, unlike `new Headers(init)`, does not throw on a
 * malformed name: an eligibility check and a history guard must give an
 * answer, not raise.
 */
export function headerEntries(headers: HeadersInit | undefined): Array<[string, string]> {
  if (!headers) {
    return [];
  }
  if (headers instanceof Headers) {
    return [...headers.entries()];
  }
  if (Array.isArray(headers)) {
    return headers.map(([name, value]) => [name.toLowerCase(), value]);
  }
  return Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]);
}

/** The header names a `RequestInit` carries, lowercased. */
export function headerNames(headers: HeadersInit | undefined): string[] {
  return headerEntries(headers).map(([name]) => name);
}

/** One header's value, across the same three forms. Names compare case-insensitively. */
export function headerValue(headers: HeadersInit | undefined, name: string): string | undefined {
  const wanted = name.toLowerCase();
  return headerEntries(headers).find(([candidate]) => candidate === wanted)?.[1];
}

/**
 * One parser for every instance: it holds no state between calls.
 *
 * Built on first use rather than at module scope, so importing this module
 * outside a browser — an SSR pass, a build step, a Node script reading the
 * barrel — does not throw before anything is rendered.
 */
let domParser: DOMParser;

/** `response` expression argument names, in `parseResponse()`'s call order. */
const RESPONSE_ARGUMENTS = ['response', 'url', 'requestInit', 'self'] as const;

/**
 * What one request overrides on the element it is built from.
 *
 * It is threaded explicitly through every step that builds a request — the
 * destination, the fields, the URL, the history URL and the `RequestInit` —
 * and never stored on the instance. The instance outlives the submission it
 * describes: a submitter left on it would keep adding its `name=value` to the
 * next programmatic `fetch()` and to every popstate replay, and a request in
 * flight would answer with whichever submission started last. The getters
 * below are the empty context, which is what a request with no submission
 * behind it is.
 */
export interface FetchRequestContext {
  /**
   * The control that caused the submission, `SubmitEvent.submitter`. It is a
   * successful control of its own form, and it carries the `formaction`,
   * `formmethod` and `formenctype` overrides.
   */
  submitter?: HTMLElement | null;

  /**
   * The history entry being restored, set only on the popstate path.
   *
   * It is both the destination — the address bar shows it already — and the
   * state of the controls, which is why it replaces the live form fields
   * instead of folding under them: the controls still hold what the visitor
   * last typed, which is stale relative to the entry being restored, and the
   * response is what brings them back in line.
   */
  restoredUrl?: URL;
}

/**
 * The submission overrides a submitter carries, when it can carry any.
 *
 * `SubmitEvent.submitter` is typed as an `HTMLElement` because a
 * form-associated custom element can submit a form, and such an element has
 * no `formaction` of its own to state.
 */
function submitterOverrides(
  submitter?: HTMLElement | null,
): HTMLButtonElement | HTMLInputElement | null {
  return submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement
    ? submitter
    : null;
}

/** The context every lifecycle event carries. */
export interface FetchEventBase {
  instance: Fetch;
  url: URL;
  requestInit: RequestInit;
}

/** The declared event surface, with the payload each event carries. */
export type FetchEmits = {
  'fetch-before': FetchEventBase;
  'fetch-fetch': FetchEventBase;
  'fetch-response': FetchEventBase & { response: Response };
  'fetch-after': FetchEventBase & { content?: unknown; error?: unknown };
  'fetch-update-before': FetchEventBase & { content: unknown };
  'fetch-update': FetchEventBase & { fragment?: Document; update?: unknown };
  'fetch-update-after': FetchEventBase & { fragment?: Document; update?: unknown };
  'fetch-error': FetchEventBase & { error: Error };
  'fetch-abort': FetchEventBase & { reason: unknown };
};

export type FetchProps = BaseProps & {
  $el: HTMLAnchorElement | HTMLFormElement;
  $refs: {
    headers: HTMLInputElement[];
  };
  $options: {
    history: boolean;
    historyMode: 'push' | 'replace';
    requestInit: RequestInit;
    headers: Record<string, string>;
    mode: SwapMode;
    selector: string;
    response: string;
    viewTransition: boolean;
    src: string;
  };
  $emits: FetchEmits;
};

/**
 * A self-contained AJAX navigation primitive bound to a link, a form or any
 * element with a `src` option. It resolves the request URL and `requestInit`
 * from that element, fetches the content, then updates the DOM by matching
 * elements from the response against the current page through the `selector`
 * option and swapping them following the `mode` option.
 *
 * @link https://ui.studiometa.dev/reference/items/Fetch/
 */
export class Fetch<T extends BaseProps = BaseProps> extends Base<FetchProps & T> {
  static config: BaseConfig = {
    name: 'Fetch',
    refs: ['headers[]'],
    options: {
      history: Boolean,
      historyMode: {
        type: String,
        default: 'push',
      },
      mode: {
        type: String,
        default: SWAP_MODES.REPLACE,
      },
      requestInit: {
        type: Object,
        // Each instance requires its own mutable default object.
        default: () => ({}),
      },
      headers: {
        type: Object,
        default: () => ({}),
      },
      selector: {
        type: String,
        default: '[id]',
      },
      response: {
        type: String,
        default: 'response.text()',
      },
      viewTransition: {
        type: Boolean,
        default: true,
      },
      src: String,
    },
  };

  /** Aborts the request in flight when a new one starts. */
  __abortController = new AbortController();

  __client: typeof fetch | undefined;

  /** The client used for the request. Assignable, so a test can inject one. */
  get client(): typeof fetch {
    return (this.__client ??= window.fetch.bind(window));
  }

  set client(client: typeof fetch) {
    this.__client = client;
  }

  /**
   * The URL history should be given for the request in flight, set only when
   * that request is the element's own navigation.
   *
   * Left unset by a call that named its own URL: `update()` receives that URL
   * and pushes it, which is what naming a destination asks for — and a
   * subclass rewriting the URL on its way to `update()` keeps that rewrite.
   *
   * @private
   */
  __historyUrl: URL | undefined;

  /**
   * The element's own destination: a form's `action`, a link's `href`, or the
   * current location as a last resort.
   *
   * A submitter's `formaction` overrides its form's action for its own
   * submission, so it overrides the destination too. It is read from the
   * attribute rather than from the `formAction` property, which answers with
   * the document URL — not with the form's action — when the attribute is
   * absent.
   *
   * On the popstate path the destination is the entry being restored: the
   * address bar shows it already, while the element's `href` or `action`
   * still points wherever it pointed when the page was rendered.
   *
   * @private
   */
  __destination(context: FetchRequestContext): string {
    if (context.restoredUrl) {
      return context.restoredUrl.href;
    }

    const { $el, isForm, isLink } = this;

    if (isForm) {
      const submitter = submitterOverrides(context.submitter);

      if (submitter?.hasAttribute('formaction')) {
        return submitter.formAction;
      }

      return ($el as HTMLFormElement).action;
    }

    if (isLink) {
      return ($el as HTMLAnchorElement).href;
    }

    return window.location.href;
  }

  /**
   * The method this request uses. A submitter's `formmethod` overrides its
   * form's method for its own submission; anything that is not a form has no
   * method of its own to state.
   *
   * @private
   */
  __method(context: FetchRequestContext): string {
    if (!this.isForm) {
      return '';
    }

    const submitter = submitterOverrides(context.submitter);
    return (submitter?.formMethod || (this.$el as HTMLFormElement).method).toLowerCase();
  }

  /**
   * The form's successful controls, the submitter included.
   *
   * The two-argument `FormData` constructor is what makes the clicked button
   * one of them, as a native submission does, and it is what a declarative
   * `<button type="submit" name="page" value="2">` rests on.
   *
   * @private
   */
  __formData(context: FetchRequestContext): FormData {
    return new FormData(this.$el as HTMLFormElement, context.submitter ?? null);
  }

  /**
   * The fields this request folds onto its base URL, or `undefined` when it
   * has none: a link, a POST form, an element that is neither.
   *
   * @private
   */
  __fields(context: FetchRequestContext): URLSearchParams | undefined {
    if (context.restoredUrl) {
      return context.restoredUrl.searchParams;
    }

    if (this.__method(context) !== 'get') {
      return undefined;
    }

    return new URLSearchParams(this.__formData(context) as unknown as Record<string, string>);
  }

  /**
   * The body of a POST request, encoded the way the effective enctype asks
   * for — the submitter's `formenctype` over the form's `enctype`, both
   * defaulting to URL encoding as a native submission does.
   *
   * Every branch returns a body `fetch()` derives a `content-type` from, so
   * none of them writes a header of its own.
   *
   * @private
   */
  __body(context: FetchRequestContext): BodyInit {
    const formData = this.__formData(context);
    const submitter = submitterOverrides(context.submitter);
    const enctype = submitter?.formEnctype || (this.$el as HTMLFormElement).enctype;

    if (enctype === 'multipart/form-data') {
      return formData;
    }

    if (enctype === 'text/plain') {
      return [...formData].map(([name, value]) => `${name}=${String(value)}\r\n`).join('');
    }

    return new URLSearchParams(formData as unknown as Record<string, string>);
  }

  /**
   * Resolve a base URL and fold this request's fields onto it.
   *
   * Fields replace what the base URL carried for the same name, and several
   * values under one name are all kept: the first field of a given name
   * deletes the base's values, and every field then appends. A single `set`
   * per field would do the first half and silently drop the second, so a
   * checkbox group or a `<select multiple>` — whose whole purpose is repeated
   * names — would reach the server with one of its values.
   *
   * @private
   */
  __resolveUrl(base: string, context: FetchRequestContext): URL {
    const url = new URL(base, window.location.href);
    const fields = this.__fields(context);

    if (!fields) {
      return url;
    }

    const overridden = new Set<string>();

    for (const [key, value] of fields) {
      if (!overridden.has(key)) {
        url.searchParams.delete(key);
        overridden.add(key);
      }

      url.searchParams.append(key, value);
    }

    return url;
  }

  /**
   * The URL to use for the request, for one request's context.
   *
   * @protected
   */
  __buildUrl(context: FetchRequestContext): URL {
    return this.__resolveUrl(this.$options.src || this.__destination(context), context);
  }

  /**
   * The URL the address bar should show, for one request's context.
   *
   * @protected
   */
  __buildHistoryUrl(context: FetchRequestContext): URL {
    return this.__resolveUrl(this.__destination(context), context);
  }

  /**
   * The URL to use for the request, with no submission behind it.
   *
   * The base URL is the `src` option when it is set, otherwise the element's
   * own destination. For a GET form the form data is then folded on top of
   * that base, so an explicit `src` can carry a fixed query that survives
   * alongside the live form fields, with form fields winning.
   */
  get url(): URL {
    return this.__buildUrl({});
  }

  /**
   * The URL the address bar should show, which is not always the one that was
   * requested.
   *
   * The `src` option answers "what to request"; this answers "what this
   * navigation is". A link may point at a page and fetch a lighter endpoint
   * that renders the same regions:
   *
   * ```html
   * <a href="/projects/page/2?orderby=title"
   *   data-component="Fetch"
   *   data-option-history
   *   data-option-src="/projects/page/2?orderby=title&sections=listing">2</a>
   * ```
   *
   * Pushing the requested URL there would put `sections=listing` in the
   * address bar and in anything a visitor copies out of it. So history follows
   * the element's own destination, folded with the same form data, and equals
   * the requested URL whenever there is no `src` to diverge from — which is
   * every element that does not set one.
   */
  get historyUrl(): URL {
    return this.__buildHistoryUrl({});
  }

  /**
   * The options for the request, merged from the element and its refs, for
   * one request's context.
   *
   * @protected
   */
  __buildRequestInit(context: FetchRequestContext): RequestInit {
    const { isForm, $options, $refs } = this;
    const { requestInit, headers } = $options;
    const requestedBy = '@studiometa/ui/Fetch';

    const normalizedRequestInit: RequestInit & { headers: Record<string, string> } = {
      ...requestInit,
      headers: {
        [HEADER_NAMES.USER_AGENT]: `${navigator.userAgent} ${requestedBy}`,
        ...(requestInit.headers as Record<string, string> | undefined),
        ...headers,
      },
    };

    for (const header of $refs.headers) {
      if (header.dataset.name && header.value) {
        normalizedRequestInit.headers[header.dataset.name] = header.value;
      }
    }

    if (isForm) {
      const method = this.__method(context);
      normalizedRequestInit.method = method;
      if (method === 'post') {
        normalizedRequestInit.body = this.__body(context);
      }
    }

    return normalizedRequestInit;
  }

  /** The options for the request, with no submission behind them. */
  get requestInit(): RequestInit {
    return this.__buildRequestInit({});
  }

  get isLink(): boolean {
    return this.$el instanceof HTMLAnchorElement;
  }

  get isForm(): boolean {
    return this.$el instanceof HTMLFormElement;
  }

  /** A plain left click on a link fetches its destination instead of navigating. */
  onClick(event: MouseEvent): void {
    if (!this.isLink) {
      return;
    }

    if (
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      !event.metaKey &&
      event.button === 0 &&
      this.$el.target !== '_blank'
    ) {
      event.preventDefault();
      // No URL: this is the element's own navigation, so `historyUrl` decides
      // what the address bar gets. Passing `this.url` here would look
      // identical and read as a caller naming a destination, which keeps a
      // `src` in history.
      void this.fetch(undefined, this.requestInit);
    }
  }

  /**
   * A form submission fetches its action with the form's own data, and with
   * the same successful controls and overrides a native submission would
   * send.
   */
  onSubmit(event: SubmitEvent): void {
    if (!this.isForm) {
      return;
    }

    if (this.$el.target !== '_blank') {
      event.preventDefault();
      // No URL: this is the element's own navigation, so `historyUrl` decides
      // what the address bar gets. Passing `this.url` here would look
      // identical and read as a caller naming a destination, which keeps a
      // `src` in history.
      //
      // The submitter travels as the context of this one call and nowhere
      // else. Passing `this.requestInit` as the second argument would also
      // undo the whole thing: the per-call init wins over the element's, so a
      // submitter-less body would overwrite the one the context builds.
      void this.fetch(undefined, {}, { submitter: event.submitter });
    }
  }

  /**
   * Update the content on history back/forward navigation.
   *
   * No URL: the request is still the element's own, so a configured `src`
   * keeps deciding what is requested and its fixed parameters survive the
   * replay. Naming the restored location as the URL instead would discard
   * that separation and fetch the displayed page. The restored entry travels
   * in the context, where it stands for both the destination and the state of
   * the controls.
   */
  onWindowPopstate(): void {
    if (!this.$options.history) {
      return;
    }

    void this.fetch(
      undefined,
      {
        headers: {
          [HEADER_NAMES.X_TRIGGERED_BY]: 'popstate',
        },
      },
      { restoredUrl: new URL(window.location.href) },
    );
  }

  /**
   * Fetch the given url.
   *
   * Omitting the `url` falls back to the {@link url} getter, so a bare
   * `fetch()` works from an event handler. Strings are resolved against the
   * current location, since the history and view-transition paths read
   * `url.pathname` and `url.searchParams`.
   */
  async fetch(
    url?: URL | string,
    requestInit: RequestInit = {},
    context: FetchRequestContext = {},
  ): Promise<void> {
    // Whether the URL came from the element or from a caller is what decides
    // where history goes: an explicit `fetch('/somewhere')` is a navigation
    // the caller named, and substituting the element's own destination for it
    // would be a surprise.
    const fromElement = url === undefined;
    const normalizedUrl = fromElement
      ? this.__buildUrl(context)
      : url instanceof URL
        ? url
        : new URL(url, window.location.href);

    this.__historyUrl = fromElement ? this.__buildHistoryUrl(context) : undefined;

    this.$emit(FETCH_EVENTS.BEFORE_FETCH, { instance: this, url: normalizedUrl, requestInit });

    this.__abortController.abort();
    const newController = new AbortController();
    newController.signal.addEventListener('abort', () => {
      this.$emit(FETCH_EVENTS.ABORT, {
        instance: this,
        url: normalizedUrl,
        requestInit,
        reason: newController.signal.reason,
      });
    });
    this.__abortController = newController;
    const init = this.mergeRequestInit(requestInit, newController.signal, context);

    this.$emit(FETCH_EVENTS.FETCH, { instance: this, url: normalizedUrl, requestInit: init });

    try {
      const response = await this.client(normalizedUrl, init);
      this.$emit(FETCH_EVENTS.RESPONSE, {
        instance: this,
        url: normalizedUrl,
        requestInit: init,
        response,
      });

      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }

      const content = await this.parseResponse(response, normalizedUrl, requestInit);
      this.$emit(FETCH_EVENTS.AFTER_FETCH, {
        instance: this,
        url: normalizedUrl,
        requestInit: init,
        content,
      });
      void this.update(normalizedUrl, init, content);
    } catch (error) {
      this.$emit(FETCH_EVENTS.AFTER_FETCH, {
        instance: this,
        url: normalizedUrl,
        requestInit: init,
        error,
      });
      this.error(normalizedUrl, init, error as Error);
    }
  }

  /**
   * The per-call `requestInit` folded onto the element's own, with the abort
   * signal of the request in flight. Carved out of `fetch()` because
   * `FetchShopifyPartial` needs the same merge before it decides whether the
   * request is expressible through its own transport.
   * @protected
   */
  mergeRequestInit(
    requestInit: RequestInit,
    signal: AbortSignal,
    context: FetchRequestContext = {},
  ): RequestInit {
    const elementRequestInit = this.__buildRequestInit(context);

    // Merged through `headerEntries()` rather than spread: spreading a
    // `Headers` instance or a tuple array yields nothing, so a caller's
    // `fetch(url, { headers: new Headers(…) })` would be dropped on the floor
    // before the request was ever built.
    const headers: Record<string, string> = {};
    for (const [name, value] of headerEntries(elementRequestInit.headers)) {
      headers[name] = value;
    }
    for (const [name, value] of headerEntries(requestInit.headers)) {
      headers[name] = value;
    }

    return {
      ...elementRequestInit,
      ...requestInit,
      headers,
      signal,
    };
  }

  /**
   * Extract the string content to inject from the raw `Response`.
   *
   * The default implementation evaluates the `response` option, giving it the
   * `response`, `url`, `requestInit` and `self` bindings and the instance as
   * `this`. Subclasses override this to parse with typed code instead.
   * @protected
   */
  parseResponse(response: Response, url: URL, requestInit: RequestInit): Promise<string> | string {
    const fn = compileExpression(RESPONSE_ARGUMENTS, `return ${this.$options.response}`) as (
      response: Response,
      url: URL,
      requestInit: RequestInit,
      self: unknown,
    ) => string;
    return fn.call(this, response, url, requestInit, self);
  }

  /**
   * Swap every element of the response whose id matches one on the page.
   *
   * `swap()` covers all four modes: this family matches an element by id and
   * puts the response's element in its place, attributes included, which is
   * what `self` asks for. The additive modes keep the page element and add to
   * its children, which is exactly `swap()`'s default.
   *
   * Every swap is started before any is awaited, so the whole update is one
   * synchronous DOM pass and the settling of all of them is awaited once.
   *
   * @protected
   */
  async updateDOM(fragment: Document): Promise<void> {
    const { mode, selector } = this.$options;
    const isAdditive = mode === SWAP_MODES.APPEND || mode === SWAP_MODES.PREPEND;
    const swaps: Promise<void>[] = [];

    for (const newElement of fragment.querySelectorAll<HTMLElement>(selector)) {
      const oldElement = newElement.id ? document.getElementById(newElement.id) : null;

      if (!oldElement || oldElement === newElement) {
        continue;
      }

      swaps.push(swap(oldElement, newElement, { mode, self: !isAdditive }));
    }

    await Promise.all(swaps);
  }

  /**
   * Announce the imminent DOM change, then apply it.
   *
   * The change travels on core's `domUpdate()` protocol, so a listener can
   * take it over through `detail.wrap()`. The component's own view transition
   * is registered as the **first** claim on that same protocol rather than as
   * an `else` branch: `wrap()` keeps the last registration, and the event
   * starts on this element, so any listener above overrides the default
   * without the component having to ask whether one exists.
   */
  async update(url: URL, requestInit: RequestInit, content: string): Promise<void> {
    const { history, viewTransition: hasViewTransition } = this.$options;

    this.$emit(FETCH_EVENTS.BEFORE_UPDATE, { instance: this, url, requestInit, content });

    domParser ??= new DOMParser();
    const fragment = domParser.parseFromString(content, 'text/html');

    this.__updateHistory(url, requestInit);

    if (history) {
      this.$write(() => {
        if (fragment.title) {
          document.title = fragment.title;
        }
      });
    }

    this.$emit(FETCH_EVENTS.UPDATE, { instance: this, url, requestInit, fragment });

    const releaseDefault = hasViewTransition
      ? this.$on(EVENTS.dom.update, (event) => {
          (event as CustomEvent<DomUpdateDetail>).detail.wrap((apply) => viewTransition(apply));
        })
      : null;

    try {
      await domUpdate(this.$el, () => this.updateDOM(fragment), {
        instance: this,
        url,
        requestInit,
        fragment,
      });
    } finally {
      releaseDefault?.();
    }

    this.$emit(FETCH_EVENTS.AFTER_UPDATE, { instance: this, url, requestInit, fragment });
  }

  /**
   * Record the navigation in the browser history, when the `history` option
   * asks for it.
   *
   * The `historyMode` option picks the writer: `push` leaves one entry per
   * update, `replace` leaves none, which is what a live search needs so that
   * a keystroke does not cost a back press.
   *
   * Nothing is written for an update popstate triggered: the entry being
   * restored is already the current one.
   *
   * @protected
   */
  __updateHistory(url: URL, requestInit: RequestInit): void {
    const { history, historyMode } = this.$options;

    if (!history || headerValue(requestInit.headers, HEADER_NAMES.X_TRIGGERED_BY) === 'popstate') {
      return;
    }

    const target = this.__historyUrl ?? url;
    const write = historyMode === 'replace' ? historyReplace : historyPush;
    write({ path: target.pathname, search: target.searchParams });
  }

  /** Announce a failed request, ignoring the abort the component caused. */
  error(url: URL, requestInit: RequestInit, error: Error): void {
    if (error.name === 'AbortError') {
      return;
    }

    this.$emit(FETCH_EVENTS.ERROR, { instance: this, url, requestInit, error });
  }

  /** Abort the request in flight. */
  abort(reason?: unknown): void {
    this.__abortController.abort(reason);
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Fetch`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Fetch;
