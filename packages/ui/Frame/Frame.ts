import { Base, getClosestParent } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { domScheduler, historyPush } from '@studiometa/js-toolkit/utils';
import { FrameAnchor } from './FrameAnchor.js';
import { FrameForm } from './FrameForm.js';
import { FrameTarget } from './FrameTarget.js';
import { FrameLoader } from './FrameLoader.js';
import type { FrameRequestInit, FrameTriggerEvent } from './types.js';
import { EVENTS } from './utils.js';

export interface FrameProps extends BaseProps {
  $children: {
    FrameAnchor: FrameAnchor[];
    FrameForm: FrameForm[];
    FrameTarget: FrameTarget[];
    FrameLoader: FrameLoader[];
  };
  $options: {
    history: boolean;
    requestInit: RequestInit;
    headers: Record<string, string>;
  };
}

/**
 * Frame class.
 * @see https://ui.studiometa.dev/-/components/Frame/
 */
export class Frame<T extends BaseProps = BaseProps> extends Base<T & FrameProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Frame',
    emits: Object.values(EVENTS),
    components: {
      FrameAnchor,
      FrameForm,
      FrameTarget,
      FrameLoader,
    },
    options: {
      history: Boolean,
      requestInit: Object,
      headers: Object,
    },
  };

  /**
   * DOM Parser to parse the new content to be injected.
   */
  domParser = new DOMParser();

  /**
   * Abort controller to prevent multiple simultaneous fetches.
   */
  abortController = new AbortController();

  /**
   * Header names.
   */
  headerNames = {
    ACCEPT: 'accept',
    X_REQUESTED_BY: 'x-requested-by',
    X_TRIGGERED_BY: 'x-triggered-by',
    USER_AGENT: 'user-agent',
  } as const;

  /**
   * Get uniq id.
   */
  get id() {
    return this.$el.id;
  }

  /**
   * The client used for the fetch request.
   */
  get client(): typeof fetch {
    return window.fetch.bind(window);
  }

  /**
   * Default request init.
   */
  get requestInit(): RequestInit {
    const { headerNames } = this;
    const { requestInit, headers } = this.$options;
    const requestedBy = '@studiometa/ui/Frame';

    return {
      ...requestInit,
      headers: {
        [headerNames.ACCEPT]: 'text/*',
        [headerNames.X_REQUESTED_BY]: requestedBy,
        [headerNames.USER_AGENT]: `${navigator.userAgent} ${requestedBy}`,
        ...requestInit.headers,
        ...headers,
      },
    };
  }

  /**
   * Get chidlren limited to the current instance.
   */
  getDirectChildren(name: keyof FrameProps['$children']) {
    const children = [];
    for (const child of this.$children[name]) {
      if (getClosestParent(child, this.constructor) === this) {
        children.push(child);
      }
    }
    return children;
  }

  /**
   * Fetch new content on frame-trigger.
   */
  onFrameAnchorFrameTrigger({ args: [url, requestInit] }: { args: FrameTriggerEvent['detail'] }) {
    this.fetch(url, requestInit);
  }

  /**
   * Fetch new content on frame-trigger.
   */
  onFrameFormFrameTrigger({ args: [url, requestInit] }: { args: [URL, FrameRequestInit] }) {
    this.fetch(url, requestInit);
  }

  /**
   * Update content on history back/forward navigation.
   */
  onWindowPopstate() {
    this.fetch(new URL(window.location.href), {
      headers: {
        [this.headerNames.X_TRIGGERED_BY]: 'popstate',
      },
    });
  }

  /**
   * Trigger FrameLoaders enter.
   */
  onFrameFetchBefore() {
    for (const loader of this.getDirectChildren('FrameLoader')) {
        loader.enter();
    }
  }

  /**
   * Trigger FrameLoaders leave.
   */
  onFrameFetchAfter() {
    for (const loader of this.getDirectChildren('FrameLoader')) {
      loader.leave();
    }
  }

  /**
   * Fetch given url.
   */
  async fetch(url: URL, requestInit: FrameRequestInit = {}) {
    this.$emit(EVENTS.FETCH_BEFORE, url, requestInit);
    requestInit.trigger?.$emit(EVENTS.FETCH_BEFORE, url, requestInit);

    this.$log('fetch', url, requestInit);
    this.$emit(EVENTS.FETCH, url, requestInit);
    requestInit.trigger?.$emit(EVENTS.FETCH, url, requestInit);

    this.abortController.abort();
    this.abortController = new AbortController();
    const init = {
      ...this.requestInit,
      ...requestInit,
      headers: {
        ...this.requestInit.headers,
        ...requestInit.headers,
      },
      signal: this.abortController.signal,
    };

    try {
      const content = await this.client(url, init).then((response) => response.text());
      this.$emit(EVENTS.FETCH_AFTER, url, requestInit, content);
      requestInit.trigger?.$emit(EVENTS.FETCH_AFTER, url, requestInit, content);
      this.content(url, init, content);
    } catch (error) {
      this.$emit(EVENTS.FETCH_AFTER, url, requestInit, error);
      requestInit.trigger?.$emit(EVENTS.FETCH_AFTER, url, requestInit, error);
      this.error(url, init, error);
    }
  }

  /**
   * Dispatch the contents to update to their matching FrameTarget.
   */
  async content(url: URL, requestInit: FrameRequestInit, content: string) {
    this.$log('content', url, content);
    this.$emit(EVENTS.CONTENT, url, requestInit, content);
    requestInit.trigger?.$emit(EVENTS.CONTENT, url, requestInit, content);

    const doc = this.domParser.parseFromString(content, 'text/html');
    const el = doc.querySelector(`#${this.id}`) ?? doc;
    const promises = [];

    // @todo inject styles and scripts from new <head>
    if (this.$options.history) {
      if (requestInit?.headers?.[this.headerNames.X_TRIGGERED_BY] !== 'popstate') {
        historyPush({ path: url.pathname, search: url.searchParams });
      }
      domScheduler.write(() => {
        if (doc.title) document.title = doc.title;
      });
    }

    for (const frameTarget of this.getDirectChildren('FrameTarget')) {
      promises.push(frameTarget.updateContent(el.querySelector(`#${frameTarget.id}`)));
    }

    await Promise.all(promises);

    this.$emit(EVENTS.CONTENT_AFTER, url, requestInit, content);
    requestInit.trigger?.$emit(EVENTS.CONTENT_AFTER, url, requestInit, content);

    // We need to update the root instance to make sure newly inserted
    // components are correctly detected and mounted. This avoid having
    // to declare all potentials component as children of the Frame component.
    await this.$root.$update();
  }

  /**
   * Handle errors.
   */
  async error(url: URL, requestInit: FrameRequestInit, error: Error) {
    this.$log('error', url, requestInit, error);
    this.$emit(EVENTS.ERROR, url, requestInit, error);
    requestInit.trigger?.$emit(EVENTS.ERROR, url, requestInit, error);
  }
}
