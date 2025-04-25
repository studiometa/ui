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
    components: {
      FrameAnchor,
      FrameForm,
      FrameTarget,
      FrameLoader,
    },
    options: {
      history: Boolean,
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
   * Get uniq id.
   */
  get id() {
    return this.$el.id;
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
   * Start on frame-fetch.
   */
  onFrameAnchorFrameFetch() {
    this.start();
  }

  /**
   * Start on frame-fetch.
   */
  onFrameFormFrameFetch() {
    this.start();
  }

  /**
   * Update content on frame-content.
   */
  onFrameAnchorFrameContent({ args: [url, content] }: { args: [URL, string] }) {
    this.content(url, content);
  }

  /**
   * Update content on frame-content.
   */
  onFrameFormFrameContent({ args: [url, content] }: { args: [URL, string] }) {
    this.content(url, content);
  }

  /**
   * Start workflow.
   */
  async start() {
    this.$log('start');
    for (const loader of this.getDirectChildren('FrameLoader')) {
      loader.enter();
    }
  }

  /**
   * End workflow.
   */
  async end() {
    this.$log('end');
    for (const loader of this.getDirectChildren('FrameLoader')) {
      loader.leave();
    }
  }

  /**
   * Dispatch the contents to update to their matching FrameTarget.
   */
  async content(url: URL, content: string, { withHistory = true } = {}) {
    this.$log('content', content);

    const doc = this.domParser.parseFromString(content, 'text/html');
    const el = doc.querySelector(`#${this.id}`) ?? doc;
    const promises = [];

    // @todo inject styles and scripts from new <head>
    if (this.$options.history) {
      if (withHistory) historyPush({ path: url.pathname, search: url.searchParams });
      domScheduler.write(() => {
        document.title = doc.title;
      });
    }

    // End the workflow before updating the content (or after?)
    this.end();

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
   * Update content on history back/forward navigation.
   */
  async onWindowPopstate() {
    const url = new URL(window.location.href);

    try {
      this.start();
      const content = await fetch(url).then((response) => response.text());
      await this.content(url, content, { withHistory: false });
    } catch (error) {
      this.$log('error', url, error);
    }
  }
}
