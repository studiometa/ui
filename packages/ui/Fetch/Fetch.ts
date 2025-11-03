import { Base, type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import { domScheduler, historyPush, isFunction } from '@studiometa/js-toolkit/utils';
import morphdom from 'morphdom';

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
   * The client used for the fetch request.
   */
  get client(): typeof fetch {
    return window.fetch.bind(window);
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

    if (headerRefs) {
      for (const header of headerRefs) {
        if (header.dataset.name && header.value) {
          normalizedRequestInit.headers[header.dataset.name] = header.value;
        }
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
    this.$emit(FETCH_EVENTS.BEFORE_FETCH, this, url, requestInit);

    this.__abortController.abort();
    this.__abortController = new AbortController();
    const init = {
      ...this.requestInit,
      ...requestInit,
      headers: {
        ...this.requestInit.headers,
        ...requestInit.headers,
      },
      signal: this.__abortController.signal,
    };

    this.$log('fetch', url, init);
    this.$emit(FETCH_EVENTS.FETCH, this, url, requestInit);

    try {
      const content = await this.client(url, init).then((response) => response.text());
      this.$emit(FETCH_EVENTS.AFTER_FETCH, this, url, requestInit, content);
      this.update(url, init, content);
    } catch (error) {
      this.$emit(FETCH_EVENTS.AFTER_FETCH, this, url, requestInit);
      this.error(url, init, error);
    }
  }

  /**
   * Update the DOM with new content from the fetched HTML.
   * @internal
   */
  __updateDOM(fragment: Document) {
    const { FETCH_MODES } = this.constructor;
    const { mode } = this.$options;

    // @ts-expect-error querySelectoAll is iterable.
    for (const newElement of fragment.querySelectorAll('[id]')) {
      const oldElement = document.querySelector(`[id="${newElement.id}"]`);
      if (!oldElement) {
        continue;
      }

      const oldScripts: Set<HTMLScriptElement> =
        newElement.tagName === 'SCRIPT'
          ? new Set([oldElement as HTMLScriptElement])
          : // @ts-expect-error querySelectoAll is iterable.
            new Set(oldElement.querySelectorAll('script'));

      switch (mode) {
        case FETCH_MODES.APPEND:
          oldElement.append(...newElement.childNodes);
          break;
        case FETCH_MODES.PREPEND:
          oldElement.prepend(...newElement.childNodes);
          break;
        case FETCH_MODES.MORPH:
          morphdom(oldElement, newElement);
          break;
        case FETCH_MODES.REPLACE:
        default:
          oldElement.replaceWith(newElement);
          break;
      }

      const newScripts: Set<HTMLScriptElement> =
        newElement.tagName === 'SCRIPT'
          ? new Set([newElement as HTMLScriptElement])
          : new Set(newElement.querySelectorAll('script'));

      this.adoptNewScripts(newScripts, oldScripts);
    }
  }

  /**
   * Dispatch the contents to update to their matching FrameTarget.
   */
  async update(url: URL, requestInit: RequestInit, content: string) {
    const { FETCH_EVENTS } = this.constructor;
    const { history } = this.$options;

    this.$log('content', url, content);
    this.$emit(FETCH_EVENTS.BEFORE_UPDATE, this, url, requestInit, content);

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

    this.$emit(FETCH_EVENTS.UPDATE, this, url, requestInit, fragment);

    if (isFunction(document.startViewTransition)) {
      await document.startViewTransition(() => {
        this.__updateDOM(fragment);
      }).ready;
    } else {
      this.__updateDOM(fragment);
    }

    this.$emit(FETCH_EVENTS.AFTER_UPDATE, this, url, requestInit, fragment);
  }

  /**
   * Handle errors.
   */
  async error(url: URL, requestInit: RequestInit, error: Error) {
    this.$log('error', url, requestInit, error);
    this.$emit(this.constructor.FETCH_EVENTS.ERROR, this, url, requestInit, error);
  }

  adoptNewScripts(scripts: Set<HTMLScriptElement>, oldScripts: Set<HTMLScriptElement>) {
    for (const script of scripts) {
      if (oldScripts.has(script)) continue;
      this.adoptNewScript(script);
    }
  }

  adoptNewScript(script: HTMLScriptElement) {
    const newScript = document.createElement('script');

    for (const attribute of script.getAttributeNames()) {
      newScript.setAttribute(attribute, script.getAttribute(attribute));
    }

    if (script.textContent) {
      newScript.textContent = script.textContent;
    }

    script.replaceWith(newScript);
  }
}
