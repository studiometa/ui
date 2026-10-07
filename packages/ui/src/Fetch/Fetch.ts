import { Base } from '@studiometa/js-toolkit/Base';
import { domUpdate } from '@studiometa/js-toolkit/domUpdate';
import { EVENTS } from '@studiometa/js-toolkit/EVENTS';
import { swap } from '@studiometa/js-toolkit/swap';
import { SWAP_MODES } from '@studiometa/js-toolkit/SWAP_MODES';
import { viewTransition } from '@studiometa/js-toolkit/viewTransition';
import type { BaseConfig, BaseProps, DomUpdateDetail, SwapMode } from '@studiometa/js-toolkit';
import { compileExpression } from '../utils/expression.js';
import {
  claimNavigation,
  registerHistoryOwner,
  releaseNavigation,
  writeEntry,
  type HistoryOwnerConstructor,
  type NavigationToken,
  type RestoreRecipe,
} from './history.js';
import {
  foldQuery,
  headerRecord,
  requestUrl,
  responseDetail,
  stringRecord,
  type FetchRequest,
  type FetchResponseDetail,
} from './request.js';

export type { FetchRequest, FetchResponseDetail } from './request.js';
export type { RestoreRecipe } from './history.js';

/**
 * The lifecycle events a `Fetch` announces, in the order they fire.
 *
 * A module constant rather than a static, because a static only pays for
 * itself if a subclass replaces the map, and nothing here does.
 */
export const FETCH_EVENTS = Object.freeze({
  BEFORE_FETCH: 'fetch-before',
  RESPONSE: 'fetch-response',
  BEFORE_UPDATE: 'fetch-update-before',
  AFTER_UPDATE: 'fetch-update-after',
  ERROR: 'fetch-error',
  ABORT: 'fetch-abort',
  AFTER_FETCH: 'fetch-after',
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

/** How a request ended: applied, failed, or aborted. */
export type FetchOutcome = 'ok' | 'error' | 'aborted';

/** What a transport loaded: the content to apply, and the response if there is one. */
export interface FetchLoadResult {
  content: unknown;
  response?: FetchResponseDetail;

  /**
   * `false` when the transport applies its own view transition, so `Fetch`
   * does not claim one around the swap.
   */
  viewTransition?: boolean;
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
const RESPONSE_ARGUMENTS = ['response', 'request', 'self'] as const;

/** The value of the `user-agent` header, which names the component. */
function userAgent(): string {
  return `${navigator.userAgent} @studiometa/ui/Fetch`;
}

/**
 * The response a failed load had received, kept beside the error rather than
 * written on it, so an error the caller threw is never changed.
 */
const errorResponses = new WeakMap<object, FetchResponseDetail>();

/** The detail every lifecycle event carries. */
interface FetchDetail {
  instance: Fetch;
  request: FetchRequest;
}

/** The declared event surface, with the payload each event carries. */
export type FetchEmits = {
  'fetch-before': FetchDetail;
  'fetch-response': FetchDetail & { response: FetchResponseDetail };
  'fetch-update-before': FetchDetail & { response?: FetchResponseDetail; content: unknown };
  'fetch-update-after': FetchDetail & { response?: FetchResponseDetail; fragment?: Document };
  'fetch-error': {
    instance: Fetch;
    request?: FetchRequest;
    response?: FetchResponseDetail;
    error: unknown;
  };
  'fetch-abort': FetchDetail & { reason: unknown };
  'fetch-after': { instance: Fetch; request?: FetchRequest; outcome: FetchOutcome };
};

export type FetchProps = BaseProps & {
  $el: HTMLAnchorElement | HTMLFormElement;
  $refs: {
    headers: HTMLInputElement[];
  };
  $options: {
    history: boolean;
    historyMode: string;
    params: Record<string, unknown>;
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

/** What starts one run of the lifecycle. */
interface FetchRun {
  /** The destination a caller named, which replaces the element's own. */
  destination?: string | URL;

  /** The entry the history coordinator restores. */
  restore?: { url: URL; recipe: RestoreRecipe };
}

/**
 * A self-contained AJAX navigation primitive bound to a link, a form or any
 * element. It builds one request from the element, loads the content, then
 * updates the DOM by matching elements from the response against the current
 * page through the `selector` option and swapping them following the `mode`
 * option. Back and forward navigation are restored by one coordinator per
 * page.
 *
 * Subclasses change how content is loaded and applied through
 * {@link Fetch.__load} and {@link Fetch.__apply}, and nothing else: the
 * lifecycle of {@link Fetch.fetch} is never overridden.
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
      params: {
        type: Object,
        default: () => ({}),
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

  /**
   * The token of the latest request of this instance.
   *
   * @private
   */
  __token: NavigationToken | undefined;

  /**
   * The ancestors of the element when the latest request started, nearest
   * first. The final events of a request reach the nearest one that is still
   * in the document when the swap has removed the element.
   *
   * @private
   */
  __ancestors: Element[] = [];

  __client: typeof fetch | undefined;

  /** The client used for the request. Assignable, so a test can inject one. */
  get client(): typeof fetch {
    return (this.__client ??= window.fetch.bind(window));
  }

  set client(client: typeof fetch) {
    this.__client = client;
  }

  get isLink(): boolean {
    return this.$el instanceof HTMLAnchorElement;
  }

  get isForm(): boolean {
    return this.$el instanceof HTMLFormElement;
  }

  /**
   * Register the class with the history coordinator, so that back and forward
   * navigation can restore its entries, also after a reload.
   */
  mounted(): void {
    if (this.$options.history) {
      registerHistoryOwner(
        this.$config.name,
        this.constructor as unknown as HistoryOwnerConstructor,
      );
    }
  }

  /**
   * The options a request of this instance runs with, as the plain data a
   * history entry keeps to restore it.
   *
   * Subclasses add their own transport options here.
   *
   * @protected
   */
  get __recipe(): RestoreRecipe {
    const { $el, $options, $refs } = this;
    const headers = {
      ...headerRecord($options.requestInit.headers),
      ...headerRecord($options.headers),
    };

    for (const ref of $refs.headers) {
      if (ref.dataset.name && ref.value) {
        headers[ref.dataset.name.toLowerCase()] = ref.value;
      }
    }

    return {
      component: this.$config.name,
      owner: $el.id || undefined,
      selector: $options.selector,
      mode: $options.mode,
      params: stringRecord($options.params),
      src: $options.src ? new URL($options.src, window.location.href).href : undefined,
      response: $options.response,
      headers,
      viewTransition: $options.viewTransition,
    };
  }

  /**
   * The history mode, `push` unless the option asks for `replace`.
   *
   * @private
   */
  get __historyMode(): 'push' | 'replace' {
    const historyMode: string = this.$options.historyMode;

    if (historyMode === 'push' || historyMode === 'replace') {
      return historyMode;
    }

    this.$warn(
      'fetch.invalid-history-mode',
      `The \`historyMode\` option must be \`push\` or \`replace\`; \`${historyMode}\` was given and \`push\` is used.`,
    );
    return 'push';
  }

  /**
   * Build the request of one run, and the recipe it runs with.
   *
   * @private
   */
  __prepare({ destination, restore }: FetchRun): {
    request: FetchRequest;
    recipe: RestoreRecipe;
  } {
    if (restore) {
      const { url, recipe } = restore;
      return {
        recipe,
        request: {
          url: requestUrl(url, { src: recipe.src, params: recipe.params, fold: true }).href,
          destination: url.href,
          method: 'GET',
          headers: {
            [HEADER_NAMES.USER_AGENT]: userAgent(),
            ...recipe.headers,
            [HEADER_NAMES.X_TRIGGERED_BY]: 'popstate',
          },
          history: false,
        },
      };
    }

    const { $el, $options, isForm, isLink } = this;
    const recipe = this.__recipe;
    let target: URL;
    let method: string;
    let body: FetchRequest['body'];
    let fold = isForm || isLink;

    if (isForm) {
      const form = $el as HTMLFormElement;
      const formData = new FormData(form);
      method = form.method.toUpperCase();
      target = new URL(form.action);

      if (method === 'GET') {
        foldQuery(
          target.searchParams,
          new URLSearchParams(formData as unknown as Record<string, string>),
        );
      } else {
        body = formData;
      }
    } else {
      const { requestInit } = $options;
      method = (requestInit.method || 'GET').toUpperCase();
      body = (requestInit.body ?? undefined) as FetchRequest['body'];
      target = new URL(isLink ? ($el as HTMLAnchorElement).href : window.location.href);
    }

    if (destination !== undefined) {
      target = new URL(destination, window.location.href);
      fold = true;
    }

    return {
      recipe,
      request: {
        url: requestUrl(target, { src: recipe.src, params: recipe.params, fold }).href,
        destination: target.href,
        method,
        headers: { [HEADER_NAMES.USER_AGENT]: userAgent(), ...recipe.headers },
        body,
        // Only a link, a form or a named destination is a place the address
        // bar can show.
        history: $options.history && fold ? this.__historyMode : false,
      },
    };
  }

  /**
   * Dispatch a lifecycle event and return whether it was cancelled.
   *
   * The event is dispatched on the element. When a swap has removed the
   * element from the document, a copy is also dispatched on its nearest
   * ancestor still in the document, or on `document`, so the listeners of
   * the page still see how the request ended.
   *
   * @private
   */
  __emit<K extends keyof FetchEmits>(name: K, detail: FetchEmits[K]): boolean {
    const emit = this.$emit as unknown as (event: string, payload: unknown) => CustomEvent;
    let isPrevented = emit.call(this, name, detail).defaultPrevented;

    if (!this.$el.isConnected) {
      const host = this.__ancestors.find((ancestor) => ancestor.isConnected) ?? document;
      const copy = new CustomEvent(name, { bubbles: true, cancelable: true, detail });
      host.dispatchEvent(copy);
      isPrevented ||= copy.defaultPrevented;
    }

    return isPrevented;
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
      (this.$el as HTMLAnchorElement).target !== '_blank'
    ) {
      event.preventDefault();
      void this.__run({});
    }
  }

  /** A form submission fetches its action with the form's own data. */
  onSubmit(event: SubmitEvent): void {
    if (!this.isForm) {
      return;
    }

    if ((this.$el as HTMLFormElement).target !== '_blank') {
      event.preventDefault();
      void this.__run({});
    }
  }

  /**
   * Load a destination and apply its content.
   *
   * The destination is what the address bar would show: the element's own
   * `href` or `action` when it is omitted. The URL that is requested is
   * derived from it through the `src` and `params` options.
   *
   * The promise resolves with the outcome once the request has ended, after
   * the DOM change, and never rejects.
   */
  fetch(destination?: string | URL): Promise<FetchOutcome> {
    return this.__run({ destination });
  }

  /**
   * Restore a history entry, from the URL the browser moved to and the recipe
   * the entry keeps. The recipe wins over the options of the instance, which
   * gives only its events and its transport.
   *
   * @protected
   */
  __restore(url: URL, recipe: RestoreRecipe): Promise<FetchOutcome> {
    return this.__run({ restore: { url, recipe } });
  }

  /**
   * The lifecycle: one request, its events, its history entry, its DOM change
   * and exactly one final `fetch-after` with the outcome.
   *
   * A request is applied only while it is the latest one of its instance,
   * and, when it writes or restores history, the latest navigation of the
   * page. A superseded request ends at once with `fetch-abort` and
   * `fetch-after`, and its response is never applied.
   *
   * @private
   */
  async __run(run: FetchRun): Promise<FetchOutcome> {
    // A new request ends the previous one first, so a loader bound to
    // `fetch-before` and `fetch-after` stays on for the new request.
    this.__token?.supersede();

    const ancestors: Element[] = [];
    for (let node = this.$el.parentElement; node; node = node.parentElement) {
      ancestors.push(node);
    }
    this.__ancestors = ancestors;

    const instance = this as unknown as Fetch;
    const controller = new AbortController();
    let request: FetchRequest | undefined;
    let response: FetchResponseDetail | undefined;
    let isStarted = false;
    let isCommitted = false;
    let outcome: FetchOutcome = 'error';

    const token: NavigationToken = {
      settled: false,
      supersede: (reason?: unknown) => {
        // Once the DOM change has started, it is not stopped half-way.
        if (token.settled || isCommitted) {
          return;
        }

        token.settled = true;
        controller.abort(reason);

        if (isStarted && request) {
          this.__emit(FETCH_EVENTS.ABORT, { instance, request, reason: controller.signal.reason });
        }

        this.__emit(FETCH_EVENTS.AFTER_FETCH, { instance, request, outcome: 'aborted' });
      },
    };

    this.__token = token;

    try {
      const prepared = this.__prepare(run);
      const { recipe } = prepared;
      request = prepared.request;

      if (this.__emit(FETCH_EVENTS.BEFORE_FETCH, { instance, request })) {
        outcome = 'aborted';
        return outcome;
      }

      if (token.settled) {
        return 'aborted';
      }

      // Read the request back once: a listener of `fetch-before` may change
      // it, and a listener of any later event no longer can.
      const { history } = request;
      request = {
        url: new URL(request.url, window.location.href).href,
        destination: new URL(request.destination, window.location.href).href,
        method: String(request.method).toUpperCase(),
        headers: headerRecord(request.headers),
        body: request.body,
        history: !run.restore && (history === 'push' || history === 'replace') ? history : false,
      };
      const sent = request;
      // Later events carry `sent`, so the lifecycle keeps its own copy of
      // what decides the history entry.
      const { method, destination, history: historyMode } = sent;
      isStarted = true;

      if (historyMode || run.restore) {
        claimNavigation(token);
      }

      const loaded = await this.__load(sent, controller.signal, recipe);

      if (token.settled) {
        return 'aborted';
      }

      response = loaded.response;
      this.__emit(FETCH_EVENTS.BEFORE_UPDATE, {
        instance,
        request: sent,
        response,
        content: loaded.content,
      });

      // The gate: a listener above may have started a newer request.
      if (token.settled) {
        return 'aborted';
      }

      isCommitted = true;
      let isWritten = false;

      if (historyMode) {
        registerHistoryOwner(
          this.$config.name,
          this.constructor as unknown as HistoryOwnerConstructor,
        );
        const isAdditive = recipe.mode === SWAP_MODES.APPEND || recipe.mode === SWAP_MODES.PREPEND;
        isWritten = writeEntry(
          historyMode,
          { method, destination },
          // Restoring added content would add it twice.
          isAdditive ? { ...recipe, mode: SWAP_MODES.REPLACE } : recipe,
          response,
        );
      }

      const fragment = await this.__swap(loaded, recipe, sent);

      if ((isWritten || run.restore) && fragment?.title) {
        document.title = fragment.title;
      }

      this.__emit(FETCH_EVENTS.AFTER_UPDATE, { instance, request: sent, response, fragment });
      outcome = 'ok';
    } catch (error) {
      if (token.settled) {
        return 'aborted';
      }

      response ??= error && typeof error === 'object' ? errorResponses.get(error) : undefined;
      this.__emit(FETCH_EVENTS.ERROR, { instance, request, response, error });
      outcome = 'error';
    } finally {
      releaseNavigation(token);

      if (!token.settled) {
        token.settled = true;
        this.__emit(FETCH_EVENTS.AFTER_FETCH, { instance, request, outcome });
      }
    }

    return outcome;
  }

  /**
   * Apply the loaded content inside the `js-toolkit:dom:update` protocol.
   *
   * The component's own view transition is registered as the first claim on
   * the protocol, so a listener above it wins. The apply callback never
   * throws: an error of the DOM change is kept and thrown once the protocol
   * has settled, so a batched view transition still applies its other
   * changes, and a runner that catches errors cannot hide it.
   *
   * @private
   */
  async __swap(
    loaded: FetchLoadResult,
    recipe: RestoreRecipe,
    request: FetchRequest,
  ): Promise<Document | undefined> {
    // A detached instance restoring an entry announces on the document, so
    // the runners of the page still negotiate the change.
    const target = this.$el.isConnected ? this.$el : document.documentElement;
    const claim =
      recipe.viewTransition && loaded.viewTransition !== false
        ? (event: Event) => {
            (event as CustomEvent<DomUpdateDetail>).detail.wrap((apply) => viewTransition(apply));
          }
        : null;

    let fragment: Document | undefined;
    let isFailed = false;
    let failure: unknown;

    if (claim) {
      target.addEventListener(EVENTS.dom.update, claim);
    }

    try {
      await domUpdate(
        target,
        async () => {
          try {
            fragment = await this.__apply(loaded.content, recipe);
          } catch (error) {
            isFailed = true;
            failure = error;
          }
        },
        { instance: this, request, response: loaded.response, content: loaded.content },
      );
    } finally {
      if (claim) {
        target.removeEventListener(EVENTS.dom.update, claim);
      }
    }

    if (isFailed) {
      throw failure;
    }

    return fragment;
  }

  /**
   * Load the content of a request: send it with the client, emit
   * `fetch-response` when the response arrives, then parse it.
   *
   * @protected
   */
  async __load(
    request: FetchRequest,
    signal: AbortSignal,
    recipe: RestoreRecipe,
  ): Promise<FetchLoadResult> {
    const raw = await this.client(request.url, {
      ...this.$options.requestInit,
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal,
    });

    // A client that does not follow the signal still gives a superseded
    // request nothing more to announce.
    signal.throwIfAborted();

    const response = responseDetail(raw);
    this.__emit(FETCH_EVENTS.RESPONSE, {
      instance: this as unknown as Fetch,
      request,
      response,
    });

    try {
      if (!raw.ok) {
        throw new Error(`Fetch failed with status ${raw.status}`);
      }

      return { response, content: await this.parseResponse(raw, request, recipe) };
    } catch (error) {
      if (error && typeof error === 'object') {
        errorResponses.set(error, response);
      }

      throw error;
    }
  }

  /**
   * Extract the content to apply from the raw `Response`.
   *
   * The default implementation evaluates the `response` expression of the
   * recipe, giving it the `response`, `request` and `self` bindings and the
   * instance as `this`. Subclasses override this to parse with typed code
   * instead.
   *
   * @protected
   */
  parseResponse(response: Response, request: FetchRequest, recipe: RestoreRecipe): unknown {
    const fn = compileExpression(RESPONSE_ARGUMENTS, `return ${recipe.response}`);
    return fn.call(this, response, request, self);
  }

  /**
   * Apply loaded content: parse it as HTML and swap every element that
   * matches the `selector` of the recipe and has an id on the page, following
   * its `mode`. Returns the parsed document.
   *
   * `swap()` covers all four modes: this family matches an element by id and
   * puts the response's element in its place, attributes included, which is
   * what `self` asks for. The additive modes keep the page element and add to
   * its children, which is exactly `swap()`'s default. Every swap is started
   * before any is awaited, so the whole update is one synchronous DOM pass.
   *
   * @protected
   */
  async __apply(content: unknown, recipe: RestoreRecipe): Promise<Document | undefined> {
    domParser ??= new DOMParser();
    const fragment = domParser.parseFromString(String(content), 'text/html');
    const { mode, selector } = recipe;
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
    return fragment;
  }

  /** Abort the request in flight. A request that has ended is left alone. */
  abort(reason?: unknown): void {
    this.__token?.supersede(reason);
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Fetch`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Fetch;
