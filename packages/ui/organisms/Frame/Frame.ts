import { Base, isDirectChild, getDirectChildren } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { nextFrame, historyPush } from '@studiometa/js-toolkit/utils';
import { FrameAnchor } from './FrameAnchor.js';
import { FrameForm } from './FrameForm.js';
import { FrameTarget } from './FrameTarget.js';

/**
 * Get the scroll position.
 */
function getScrollPosition() {
  return {
    left: window.pageXOffset,
    top: window.pageYOffset,
  };
}

/**
 * The fetch cache.
 */
const cache: Map<
  string,
  { promise: Promise<string>; status: 'pending' | 'resolved' | 'error'; content: string }
> = new Map();

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
   * Config.
   */
  static config: BaseConfig = {
    name: 'Frame',
    emits: [
      'before-fetch',
      'after-fetch',
      'before-leave',
      'after-leave',
      'before-content',
      'after-content',
      'before-enter',
      'after-enter',
    ],
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
   * Get direct `FrameTarget` children.
   */
  get directChildrenFrameTarget(): FrameTarget[] {
    return getDirectChildren(this, 'Frame', 'FrameTarget');
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
        scroll: getScrollPosition(),
      },
      '',
    );
  }

  /**
   * Go to the previous URL on `popstate` event.
   */
  onWindowPopstate(event: PopStateEvent) {
    this.goTo(window.location.href, null, event.state);
  }

  /**
   * Prevent click on `FrameAnchor`.
   */
  onFrameAnchorClick(index: number, event: MouseEvent) {
    // Prevent propagation of nested frames
    if (!isDirectChild(this, 'Frame', 'FrameAnchor', this.$children.FrameAnchor[index])) {
      return;
    }

    this.$log('onAFrameClick', index, event);
    event.preventDefault();
    const anchor = this.$children.FrameAnchor[index];

    // Do nothing when clicking links on the same page
    // @todo handle hash change
    if (anchor.href === window.location.href) {
      return;
    }

    this.goTo(anchor.href);
  }

  /**
   * Prevent submit on forms.
   */
  onFrameFormSubmit(index: number, event: SubmitEvent) {
    // Prevent propagation of nested frames
    if (!isDirectChild(this, 'Frame', 'FrameForm', this.$children.FrameForm[index])) {
      return;
    }

    this.$log('onFrameFormFrameSubmit', index, event);
    event.preventDefault();
    const form = this.$children.FrameForm[index];
    const url = new URL(form.action);

    if (form.$el.method === 'get') {
      // @ts-ignore
      url.search = new URLSearchParams(new FormData(form.$el)).toString();
      this.goTo(url.toString());
    }

    if (form.$el.method === 'post') {
      this.goTo(url.toString(), new FormData(form.$el));
    }
  }

  /**
   * Parge an HTML string into a DOM object.
   */
  parseHTML(string = '') {
    return new DOMParser().parseFromString(string, 'text/html');
  }

  /**
   * Go to the given url.
   */
  async goTo(url: string, formData: FormData = null, scroll: { top: number; left: number } = null) {
    this.$log('goTo', url);
    const parsedUrl = new URL(url);

    if (parsedUrl.origin !== window.location.origin) {
      throw new Error('Cross origin request are not allowed.');
    }

    this.$emit('before-fetch', url);

    // @todo add option to use content as is or to parse it and extract the new frame
    const content = await this.fetch(url, formData);
    const doc = this.parseHTML(content);
    const el = doc.querySelector(`#${this.id}`);
    // @todo manage el === null
    const newFrame = new Frame(el as HTMLElement);
    newFrame.$children.registerAll();

    this.$emit('after-fetch', url, content);

    this.$emit('before-leave');
    // Leave all
    await Promise.all(this.directChildrenFrameTarget.map((target) => target.leave()));

    this.$emit('after-leave');
    this.$emit('before-content');

    // Update content
    // @todo insert non existing FrameTarget as well
    this.directChildrenFrameTarget.map((target, index) =>
      target.updateContent(newFrame.directChildrenFrameTarget[index]),
    );

    // Push history
    if (this.$options.history) {
      document.title = doc.title;
      historyPush({ path: parsedUrl.pathname, search: parsedUrl.searchParams });
    }

    if (scroll) {
      document.scrollingElement.scrollTop = scroll.top;
      document.scrollingElement.scrollLeft = scroll.left;
    }

    // Update components
    await nextFrame();
    this.$root.$update();
    await nextFrame();

    this.$emit('after-content');
    this.$emit('before-enter');

    // Enter all
    await Promise.all(this.directChildrenFrameTarget.map((target) => target.enter()));

    this.$emit('after-enter');
  }

  /**
   * Fetch the given url.
   */
  async fetch(url: string, formData: FormData = null): Promise<string> {
    // @note skip cache for POST requests.
    if (formData) {
      const promise = fetch(url, {
        method: 'post',
        body: formData,
      }).then((response) => response.text());

      const content = await promise;
      return content;
    }

    const cached = cache.get(url);

    if (cached) {
      if (cached.status === 'pending') {
        return cached.promise;
      }

      return cached.content;
    }

    const promise = fetch(url).then((response) => response.text());

    try {
      cache.set(url, {
        promise,
        status: 'pending',
        content: undefined,
      });

      const content = await promise;

      cache.set(url, {
        promise,
        status: 'resolved',
        content,
      });

      return content;
    } catch (err) {
      cache.set(url, {
        promise,
        status: 'error',
        content: err,
      });

      return err;
    }
  }
}
