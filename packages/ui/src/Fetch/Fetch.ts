import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps, BaseInterface } from '@studiometa/js-toolkit';
import { domScheduler } from '@studiometa/js-toolkit/utils/domScheduler';
import { historyPush } from '@studiometa/js-toolkit/utils/historyPush';
import morphdom from 'morphdom';
import { viewTransition as scheduleViewTransition } from '../ViewTransition/scheduler.js';
import { emitDomUpdate, runWrapped } from '../utils/dom-update.js';
import { adoptNewScripts, getScripts } from './utils.js';

export interface FetchProps extends BaseProps {
  $el: HTMLAnchorElement | HTMLFormElement;
  $refs: {
    headers: HTMLInputElement[];
  };
  $options: {
    history: boolean;
    requestInit: RequestInit;
    headers: Record<string, string>;
    mode: 'replace' | 'prepend' | 'append' | 'morph';
    selector: string;
    response: string;
    viewTransition: boolean;
    src: string;
  };
}

export type FetchConstructor<T extends Fetch = Fetch> = {
  new (...args: any[]): T;
  prototype: Fetch;
} & Pick<typeof Fetch, keyof typeof Fetch>;

/**
 * Fetch class.
 *
 * A self-contained AJAX navigation primitive bound to a link, a form or any element with a
 * `src` option. It resolves the request URL and `requestInit` from that element, fetches the
 * content, then updates the DOM by matching elements from the response against the current
 * page via the `selector` option and swapping them following the `mode` option (`replace`,
 * `prepend`, `append` or `morph`). It optionally pushes browser history, wraps the update in a
 * View Transition and emits a full set of lifecycle events.
 *
 * @link https://ui.studiometa.dev/reference/items/Fetch/
 */
export class Fetch<T extends BaseProps = BaseProps>
  extends Base<T & FetchProps>
  implements BaseInterface
{
  /**
   * Declare the `this.constructor` type
   * @link https://github.com/microsoft/TypeScript/issues/3841#issuecomment-2381594311
   */
  declare ['constructor']: FetchConstructor;

  /**
   * Fetch events enum.
   */
  static FETCH_EVENTS = {
    BEFORE_FETCH: 'fetch-before',
    FETCH: 'fetch-fetch',
    RESPONSE: 'fetch-response',
    AFTER_FETCH: 'fetch-after',
    BEFORE_UPDATE: 'fetch-update-before',
    UPDATE: 'fetch-update',
    AFTER_UPDATE: 'fetch-update-after',
    ERROR: 'fetch-error',
    ABORT: 'fetch-abort',
  } as const;

  /**
   * Fetch modes enum.
   */
  static FETCH_MODES = {
    REPLACE: 'replace',
    PREPEND: 'prepend',
    APPEND: 'append',
    MORPH: 'morph',
  } as const;

  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Fetch',
    emits: [...Object.values(this.FETCH_EVENTS), 'dom-update'],
    refs: ['headers[]'],
    options: {
      history: Boolean,
      mode: {
        type: String,
        default: this.FETCH_MODES.REPLACE,
      },
      requestInit: Object,
      headers: Object,
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
   * Header names used by the requestInit property.
   * @internal
   */
  __headerNames = {
    ACCEPT: 'accept',
    X_REQUESTED_BY: 'x-requested-by',
    X_TRIGGERED_BY: 'x-triggered-by',
    USER_AGENT: 'user-agent',
  } as const;

  /**
   * DOM Parser to parse the new content to be injected.
   * @internal
   */
  __domParser = new DOMParser();

  /**
   * Abort controller to prevent multiple simultaneous fetches.
   * @internal
   */
  __abortController = new AbortController();

  /**
   * Client.
   * @internal
   */
  __client: typeof fetch;

  /**
   * The client used for the fetch request.
   */
  get client(): typeof fetch {
    return (this.__client ??= window.fetch.bind(window));
  }

  /**
   * The URL history should be given for the request in flight.
   *
   * Set by `fetch()`, which is the only place that knows whether the URL came from the
   * element or from a caller. `update()` may also be called directly, so it falls back to
   * the URL it was given.
   *
   * @private
   */
  __historyUrl: URL | undefined;

  /**
   * The element's own destination: a form's `action`, a link's `href`, or the current
   * location as a last resort.
   *
   * @private
   */
  get __destination(): string {
    const { $el, isForm, isLink } = this;

    if (isForm) {
      return ($el as HTMLFormElement).action;
    }

    if (isLink) {
      return ($el as HTMLAnchorElement).href;
    }

    return window.location.href;
  }

  /**
   * Resolve a base URL and fold a GET form's fields onto it.
   *
   * Fields replace what the base URL carried for the same name, and several values under
   * one name are all kept: the first field of a given name deletes the base's values, and
   * every field then appends. A single `set` per field would have done the first half and
   * silently dropped the second, so a checkbox group or a `<select multiple>` — whose whole
   * purpose is repeated names — reached the server with one of its values.
   *
   * @private
   */
  __resolveUrl(base: string): URL {
    const { $el, isForm } = this;
    const url = new URL(base, window.location.href);

    if (!isForm || ($el as HTMLFormElement).method.toLowerCase() !== 'get') {
      return url;
    }

    const overridden = new Set<string>();

    // @ts-expect-error URLSearchParams accepts FormData as parameter in the browser.
    for (const [key, value] of new URLSearchParams(new FormData($el))) {
      if (!overridden.has(key)) {
        url.searchParams.delete(key);
        overridden.add(key);
      }

      url.searchParams.append(key, value);
    }

    return url;
  }

  /**
   * The URL to use for the request.
   *
   * The base URL is the `src` option when it is set, otherwise the element's own
   * destination. For a GET form, the form data is then folded onto that base — so an
   * explicit `src` can carry a fixed query (e.g. `?section_id=…`) that survives alongside
   * the live form fields, with form fields winning on conflict.
   */
  get url(): URL {
    return this.__resolveUrl(this.$options.src || this.__destination);
  }

  /**
   * The URL the address bar should show, which is not always the one that was requested.
   *
   * The `src` option answers "what to request"; this answers "what this navigation is". A
   * link may point at a page and fetch a lighter endpoint that renders the same regions:
   *
   * ```html
   * <a href="/projects/page/2?orderby=title"
   *   data-component="Fetch"
   *   data-option-history
   *   data-option-src="/projects/page/2?orderby=title&sections=listing">2</a>
   * ```
   *
   * Pushing the requested URL there would put `sections=listing` in the address bar and in
   * anything a visitor copies out of it. So history follows the element's own destination,
   * folded with the same form data, and falls back to the requested URL whenever there is
   * no `src` to diverge from — which is every element that does not set one.
   */
  get historyUrl(): URL {
    return this.__resolveUrl(this.__destination);
  }

  /**
   * Option for the fetch request.
   */
  get requestInit(): RequestInit {
    const { __headerNames: headerNames, isForm, $el, $options, $refs } = this;
    const { requestInit, headers } = $options;
    const { headers: headerRefs } = $refs;
    const requestedBy = '@studiometa/ui/Fetch';

    const normalizedRequestInit = {
      ...requestInit,
      headers: {
        [headerNames.USER_AGENT]: `${navigator.userAgent} ${requestedBy}`,
        ...requestInit.headers,
        ...headers,
      },
    };

    for (const header of headerRefs) {
      if (header.dataset.name && header.value) {
        normalizedRequestInit.headers[header.dataset.name] = header.value;
      }
    }

    if (isForm) {
      const form = $el as HTMLFormElement;
      const method = form.method.toLowerCase();
      normalizedRequestInit.method = method;
      if (method === 'post') {
        normalizedRequestInit.body = new FormData(form);
      }
    }

    return normalizedRequestInit;
  }

  /**
   * Is the root element a link?
   */
  get isLink() {
    return this.$el instanceof HTMLAnchorElement;
  }

  /**
   * Is the root element a form?
   */
  get isForm() {
    return this.$el instanceof HTMLFormElement;
  }

  /**
   * Emit bubbling events.
   * @inheritdoc
   */
  $emit(event: string, ...args: unknown[]) {
    const e = new CustomEvent(event, { detail: args, bubbles: true });
    return super.$emit(e, ...args);
  }

  /**
   * If root element is a link, prevent its default behavior and fetch its URL.
   */
  onClick({ event }: { event: MouseEvent }) {
    if (!this.isLink) return;

    if (
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      !event.metaKey &&
      event.button === 0 &&
      this.$el.target !== '_blank'
    ) {
      event.preventDefault();
      this.fetch(this.url, this.requestInit);
    }
  }

  /**
   * If root element is a form, prevent its default behavior on submit and fetch its action
   * following the `method` attribute and with the form's data.
   */
  onSubmit({ event }: { event: SubmitEvent }) {
    if (!this.isForm) return;

    if (this.$el.target !== '_blank') {
      event.preventDefault();
      this.fetch(this.url, this.requestInit);
    }
  }

  /**
   * Update content on history back/forward navigation.
   */
  onWindowPopstate() {
    if (!this.$options.history) return;

    this.fetch(new URL(window.location.href), {
      headers: {
        [this.__headerNames.X_TRIGGERED_BY]: 'popstate',
      },
    });
  }

  /**
   * Fetch given url.
   *
   * The `url` parameter is optional and defaults to the {@link url} getter, allowing a bare
   * `fetch()` call from an event or a decorator. String or relative inputs are coerced into a
   * `URL` object resolved against the current location so the history and view-transition
   * paths — which rely on `url.pathname` and `url.searchParams` — stay safe.
   */
  async fetch(url?: URL | string, requestInit: RequestInit = {}) {
    // Whether the URL came from the element or from the caller, which is what decides
    // where history goes: an explicit `fetch('/somewhere')` is a navigation the caller
    // named, and substituting the element's own destination for it would be a surprise.
    const fromElement = url === undefined;
    const normalizedUrl = fromElement
      ? this.url
      : url instanceof URL
        ? url
        : new URL(url, window.location.href);

    this.__historyUrl = fromElement ? this.historyUrl : normalizedUrl;

    const { FETCH_EVENTS } = this.constructor;
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
    const init = {
      ...this.requestInit,
      ...requestInit,
      headers: {
        ...this.requestInit.headers,
        ...requestInit.headers,
      },
      signal: newController.signal,
    };

    this.$log('fetch', normalizedUrl, init);
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

      const content = await this.__parseResponse(response, normalizedUrl, requestInit);
      this.$emit(FETCH_EVENTS.AFTER_FETCH, {
        instance: this,
        url: normalizedUrl,
        requestInit: init,
        content,
      });
      this.update(normalizedUrl, init, content);
    } catch (error) {
      this.$emit(FETCH_EVENTS.AFTER_FETCH, {
        instance: this,
        url: normalizedUrl,
        requestInit: init,
        error,
      });
      this.error(normalizedUrl, init, error);
    }
  }

  /**
   * Extract the string content to inject from the raw `Response`.
   *
   * The default implementation evaluates the `response` option expression, giving it access to
   * the `response`, `url`, `requestInit` and `self` bindings and to the component instance via
   * `this`. Subclasses can override this to parse the response with real, typed code instead of
   * a declarative option string.
   * @protected
   */
  __parseResponse(
    response: Response,
    url: URL,
    requestInit: RequestInit,
  ): Promise<string> | string {
    const fn = new Function(
      'response',
      'url',
      'requestInit',
      'self',
      `return ${this.$options.response}`,
    );
    return fn.call(this, response, url, requestInit, self);
  }

  /**
   * Update the DOM with new content from the fetched HTML.
   * @internal
   */
  __updateDOM(fragment: Document) {
    const { FETCH_MODES } = this.constructor;
    const { mode, selector } = this.$options;

    for (const newElement of fragment.querySelectorAll<HTMLElement>(selector)) {
      const oldElement = newElement.id && document.getElementById(newElement.id);

      if (!oldElement || oldElement === newElement) {
        continue;
      }

      const oldScripts = getScripts(oldElement);

      switch (mode) {
        case FETCH_MODES.APPEND:
          oldElement.append(...newElement.childNodes);
          adoptNewScripts(getScripts(oldElement), oldScripts);
          break;
        case FETCH_MODES.PREPEND:
          oldElement.prepend(...newElement.childNodes);
          adoptNewScripts(getScripts(oldElement), oldScripts);
          break;
        case FETCH_MODES.MORPH:
          morphdom(oldElement, newElement);
          adoptNewScripts(getScripts(oldElement), oldScripts);
          break;
        case FETCH_MODES.REPLACE:
        default:
          oldElement.replaceWith(newElement);
          adoptNewScripts(getScripts(newElement), oldScripts);
          break;
      }
    }
  }

  /**
   * Dispatch the contents to update to their matching FrameTarget.
   *
   * After the `fetch-update` event, the bubbling `dom-update` protocol event announces the imminent DOM change. Its `detail.wrap()` lets a listener register a runner — a function receiving the `apply` callback, or a transitioner object exposing `update(mutate)` — that substitutes the default update path and is awaited before the `fetch-update-after` event. Registration is only valid synchronously while the event dispatches and the last `wrap` call wins. With no registered runner and the `viewTransition` option enabled, the update runs through the shared `viewTransition` scheduler — batched and serialized with every other scheduled view transition, falling back to a direct update when the API is unavailable.
   */
  async update(url: URL, requestInit: RequestInit, content: string) {
    const { FETCH_EVENTS } = this.constructor;
    const { history, viewTransition } = this.$options;

    this.$log('content', url, content);
    this.$emit(FETCH_EVENTS.BEFORE_UPDATE, { instance: this, url, requestInit, content });

    const fragment = this.__domParser.parseFromString(content, 'text/html');

    if (history) {
      if (requestInit?.headers?.[this.__headerNames.X_TRIGGERED_BY] !== 'popstate') {
        const target = this.__historyUrl ?? url;
        historyPush({ path: target.pathname, search: target.searchParams });
      }
      domScheduler.write(() => {
        if (fragment.title) {
          document.title = fragment.title;
        }
      });
    }

    this.$emit(FETCH_EVENTS.UPDATE, { instance: this, url, requestInit, fragment });

    const runner = emitDomUpdate(this);

    if (runner) {
      await runWrapped(this, runner, () => this.__updateDOM(fragment));
    } else if (viewTransition) {
      await scheduleViewTransition(() => {
        this.__updateDOM(fragment);
      });
    } else {
      this.__updateDOM(fragment);
    }

    this.$emit(FETCH_EVENTS.AFTER_UPDATE, { instance: this, url, requestInit, fragment });
  }

  /**
   * Handle errors.
   */
  error(url: URL, requestInit: RequestInit, error: Error) {
    if (error.name === 'AbortError') return;

    this.$log('error', url, requestInit, error);
    this.$emit(this.constructor.FETCH_EVENTS.ERROR, { instance: this, url, requestInit, error });
  }

  /**
   * Abort the current request.
   */
  abort(reason?: any) {
    this.__abortController.abort(reason);
  }
}

export default Fetch;
