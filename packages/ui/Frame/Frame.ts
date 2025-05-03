import { Base, getClosestParent } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { domScheduler, historyPush } from '@studiometa/js-toolkit/utils';
import { FrameAnchor } from './FrameAnchor.js';
import { FrameForm } from './FrameForm.js';
import { FrameTarget } from './FrameTarget.js';
import { FrameLoader } from './FrameLoader.js';

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
 * Class.
 */
export class Frame<T extends BaseProps = BaseProps> extends Base<T & FrameProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Frame',
    emits: ['frame-fetch', 'frame-content', 'frame-error'],
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
  onFrameAnchorFrameTrigger({ args: [url, requestInit] }: { args: [URL, RequestInit] }) {
    this.fetch(url, requestInit);
  }

  /**
   * Fetch new content on frame-trigger.
   */
  onFrameFormFrameTrigger({ args: [url, requestInit] }: { args: [URL, RequestInit] }) {
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
   * Start workflow.
   */
  async startFetch() {
    this.$log('start');
    for (const loader of this.getDirectChildren('FrameLoader')) {
      loader.enter();
    }
  }

  /**
   * End workflow.
   */
  async endFetch() {
    this.$log('end');
    for (const loader of this.getDirectChildren('FrameLoader')) {
      loader.leave();
    }
  }

  /**
   * Fetch given url.
   */
  async fetch(url: URL, requestInit: RequestInit = {}) {
    this.startFetch();

    this.$log('fetch', url, requestInit);
    this.$emit('frame-fetch', url, requestInit);

    try {
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

      const content = await this.client(url, init).then((response) => response.text());
      await Promise.all([this.content(url, content, init), this.endFetch()]);
    } catch (error) {
      await Promise.all([this.error(url, error), this.endFetch()]);
    }
  }

  /**
   * Dispatch the contents to update to their matching FrameTarget.
   */
  async content(url: URL, content: string, requestInit: RequestInit) {
    this.$log('content', url, content);
    this.$emit('frame-content', url, content);

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

    // We need to update the root instance to make sure newly inserted
    // components are correctly detected and mounted. This avoid having
    // to declare all potentials component as children of the Frame component.
    this.$root.$update();
  }

  /**
   * Handle errors.
   */
  async error(url: URL, error: Error) {
    this.$log('error', url, error);
    this.$emit('frame-error', url, error);
  }
}
