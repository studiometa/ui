import { Base, type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import { domScheduler, historyPush, isFunction } from '@studiometa/js-toolkit/utils';
import morphdom from 'morphdom';
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
  };
}

export type FetchConstructor<T extends Fetch = Fetch> = {
  new (...args: any[]): T;
  prototype: Fetch;
} & Pick<typeof Fetch, keyof typeof Fetch>;

/**
 * Fetch class.
 * @link https://ui.studiometa.dev/-/components/Fetch/
 */
export class Fetch<T extends BaseProps = BaseProps> extends Base<T & FetchProps> {
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
    emits: Object.values(this.FETCH_EVENTS),
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
   * The URL to use for the request.
   */
  get url(): URL {
    const { $el, isForm } = this;

    if (isForm) {
      const { action, method } = this.$el as HTMLFormElement;
      const url = new URL(action);

      if (method.toLowerCase() === 'get') {
        // @ts-expect-error URLSearchParams accepts FormData as parameter in the browser.
        url.search = new URLSearchParams(new FormData($el)).toString();
      }

      return url;
    }

    return new URL($el.href);
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
      normalizedRequestInit.method = form.method;
      normalizedRequestInit.body = new FormData(form);
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
   */
  async fetch(url: URL, requestInit: RequestInit = {}) {
    const { FETCH_EVENTS } = this.constructor;
    this.$emit(FETCH_EVENTS.BEFORE_FETCH, { instance: this, url, requestInit });

    this.__abortController.abort();
    const newController = new AbortController();
    newController.signal.addEventListener('abort', () => {
      this.$emit(FETCH_EVENTS.ABORT, { instance: this, url, requestInit, reason: newController.signal.reason })
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

    this.$log('fetch', url, init);
    this.$emit(FETCH_EVENTS.FETCH, { instance: this, url, requestInit: init });

    try {
      const response = await this.client(url, init);

      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }

      const content = await response.text();
      this.$emit(FETCH_EVENTS.AFTER_FETCH, { instance: this, url, requestInit, content });
      this.update(url, init, content);
    } catch (error) {
      this.$emit(FETCH_EVENTS.AFTER_FETCH, { instance: this, url, requestInit, error });
      this.error(url, init, error);
    }
  }

  /**
   * Update the DOM with new content from the fetched HTML.
   * @internal
   */
  __updateDOM(fragment: Document) {
    const { FETCH_MODES } = this.constructor;
    const { mode, selector } = this.$options;

    // @ts-expect-error querySelectorAll is iterable in the browser
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
   */
  async update(url: URL, requestInit: RequestInit, content: string) {
    const { FETCH_EVENTS } = this.constructor;
    const { history } = this.$options;

    this.$log('content', url, content);
    this.$emit(FETCH_EVENTS.BEFORE_UPDATE, { instance: this, url, requestInit, content });

    const fragment = this.__domParser.parseFromString(content, 'text/html');

    if (history) {
      if (requestInit?.headers?.[this.__headerNames.X_TRIGGERED_BY] !== 'popstate') {
        historyPush({ path: url.pathname, search: url.searchParams });
      }
      domScheduler.write(() => {
        if (fragment.title) {
          document.title = fragment.title;
        }
      });
    }

    this.$emit(FETCH_EVENTS.UPDATE, { instance: this, url, requestInit, fragment });

    if (isFunction(document.startViewTransition)) {
      await document.startViewTransition(() => {
        this.__updateDOM(fragment);
      }).ready;
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
