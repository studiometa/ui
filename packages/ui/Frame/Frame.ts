import { Base, isDirectChild, getDirectChildren, getClosestParent } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { nextFrame, historyPush } from '@studiometa/js-toolkit/utils';
import { FrameAnchor } from './FrameAnchor.js';
import { FrameForm } from './FrameForm.js';
import { FrameTarget } from './FrameTarget.js';

/**
 * The fetch cache.
 */
const cache: Map<
  string,
  { promise: Promise<string>; status: 'pending' | 'resolved' | 'error'; content: string }
> = new Map();

export type FrameGoToParams = {
  url: string | URL;
  formData?: FormData;
  scroll?: { top: number; left: number };
};

export interface FrameProps extends BaseProps {
  $children: {
    FrameAnchor: FrameAnchor[];
    FrameForm: FrameForm[];
    FrameTarget: FrameTarget[];
    // eslint-disable-next-line no-use-before-define
    Frame: Frame[];
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
   * Declare the `this.constructor` type
   * @see https://github.com/microsoft/TypeScript/issues/3841#issuecomment-2381594311
   */
  declare ['constructor']: typeof Frame;
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Frame',
    components: {
      FrameAnchor,
      FrameForm,
      FrameTarget,
      Frame,
    },
    options: {
      history: Boolean,
    },
  };

  /**
   * Get uniq id.
   */
  get id() {
    return this.$el.id;
  }

  /**
   * Get the scroll position.
   */
  get scrollPosition() {
    return {
      left: window.pageXOffset,
      top: window.pageYOffset,
    };
  }

  /**
   * Get direct `FrameTarget` children.
   */
  get directChildrenFrameTarget(): FrameTarget[] {
    const frameTargets = [];
    for (const frameTarget of this.$children.FrameTarget) {
      if (getClosestParent(frameTarget, this.constructor) === this) {
        frameTargets.push(frameTarget);
      }
    }
    return frameTargets;
  }

  /**
   * Prevent scroll top on unload.
   */
  onWindowUnload() {
    const { history } = window;

    if (!history.state) {
      return;
    }

    history.replaceState(
      {
        ...history.state,
        scroll: this.scrollPosition,
      },
      '',
    );
  }

  /**
   * Go to the previous URL on `popstate` event.
   */
  onWindowPopstate({ event }: { event: PopStateEvent }) {
    this.goTo({ url: window.location.href, scroll: event.state });
  }

  /**
   * Prevent click on `FrameAnchor`.
   */
  onFrameAnchorClick({ target, event }: { event: MouseEvent; target: FrameAnchor }) {
    // Prevent propagation of nested frames
    if (getClosestParent(target, this.constructor) !== this) {
      return;
    }

    // Do nothing when clicking links on the same page
    // @todo handle hash change
    if (target.href === window.location.href) {
      return;
    }

    this.goTo({ url: target.href });
  }

  /**
   * Prevent submit on forms.
   */
  onFrameFormSubmit({ event, target }: { event: SubmitEvent; target: FrameForm }) {
    // Prevent propagation of nested frames
    if (getClosestParent(target, this.constructor) !== this) {
      return;
    }

    const url = new URL(target.action);

    if (target.$el.method === 'get') {
      url.search = new URLSearchParams(new FormData(target.$el).toString()).toString();
      this.goTo({ url: url });
    }

    if (target.$el.method === 'post') {
      this.goTo({ url, formData: new FormData(target.$el) });
    }
  }

  /**
   * Parge an HTML string into a DOM object.
   */
  async parseHTML(string = '') {
    return new DOMParser().parseFromString(string, 'text/html');
  }

  async parseUrl(url: URL | string) {
    let parsedUrl = new URL(url);

    if (parsedUrl.origin !== window.location.origin) {
      throw new Error('Cross origin request are not allowed.');
    }

    return parsedUrl;
  }

  async parse(url: URL, content: string) {
    return this.parseHTML(content);
  }

  async leave() {
    await Promise.all(this.directChildrenFrameTarget.map((target) => target.leave()));
  }

  async content(doc: Document) {
    // Update content
    for (const frameTarget of this.directChildrenFrameTarget) {
      const { id } = frameTarget;
      const newContent = doc.querySelector(`#${frameTarget.id}`);
      frameTarget.updateContent(newContent);
    }
  }

  async history(url: URL, doc: Document, formData: FormData = null) {
    // Push history
    if (this.$options.history && formData === null) {
      document.title = doc.title;
      historyPush({ path: url.pathname, search: url.searchParams });
    }
  }

  async scroll(scroll: { top: number; left: number } = null) {
    if (scroll) {
      document.scrollingElement.scrollTop = scroll.top;
      document.scrollingElement.scrollLeft = scroll.left;
    }
  }

  async update() {
    // Update components
    await nextFrame();
    this.$root.$update();
    await nextFrame();
  }

  async enter() {
    await Promise.all(this.directChildrenFrameTarget.map((target) => target.enter()));
  }

  /**
   * Go to the given url.
   * @todo implement a "bag" to save current data and avoid having to pass params to each method
   * @todo implement AbortSignal to cancel previous pending requests
   */
  async goTo({ url, formData = null, scroll = null }: FrameGoToParams) {
    const parsedUrl = await this.parseUrl(url);
    // @todo add option to use content as is or to parse it and extract the new frame
    const content = await this.fetch(parsedUrl, formData);
    const doc = await this.parse(parsedUrl, content);

    await this.leave();
    await this.content(doc);
    await this.history(parsedUrl, doc, formData);
    await this.scroll(scroll);
    await this.update();
    await this.enter();
  }

  /**
   * Fetch the given url.
   */
  async fetch(url: URL, formData: FormData = null): Promise<string> {
    const headers = {
      'x-requested-by': 'studiometa/ui/Frame',
    };

    // @note skip cache for POST requests.
    if (formData) {
      const promise = fetch(url, {
        method: 'POST',
        body: formData,
        headers,
      }).then((response) => response.text());

      const content = await promise;
      return content;
    }

    const cached = cache.get(url.toString());

    if (cached) {
      if (cached.status === 'pending') {
        return cached.promise;
      }

      return cached.content;
    }

    const promise = fetch(url, { headers }).then((response) => response.text());

    try {
      cache.set(url.toString(), {
        promise,
        status: 'pending',
        content: undefined,
      });

      const content = await promise;

      cache.set(url.toString(), {
        promise,
        status: 'resolved',
        content,
      });

      return content;
    } catch (err) {
      cache.set(url.toString(), {
        promise,
        status: 'error',
        content: err,
      });

      return err;
    }
  }
}
