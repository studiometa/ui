import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { AnchorScrollTo } from '../../atoms/index.js';

export interface TableOfContentAnchorProps extends BaseProps {
  $options: {
    activeClass: string;
  };
}

/**
 * TableOfContentAnchor class.
 */
export class TableOfContentAnchor<T extends BaseProps = BaseProps> extends AnchorScrollTo<
  T & TableOfContentAnchorProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'TableOfContentAnchor',
    emits: ['should-activate'],
    options: {
      activeClass: {
        type: String,
        default: 'is-active',
      },
    },
  };

  /**
   * Observer.
   * @private
   */
  __observer: IntersectionObserver;

  /**
   * Get the sentinel.
   */
  get sentinel():HTMLElement {
    return document.querySelector(this.targetSelector) as HTMLElement;
  }

  /**
   * Init observer on mount.
   */
  mounted() {
    if (!this.sentinel) {
      return;
    }

    this.__observer = new IntersectionObserver(([entry]) => {
      const shouldActivate =
        entry.isIntersecting &&
        entry.boundingClientRect.y < 100 &&
        entry.boundingClientRect.y > 100;
      this.$el.classList.toggle(this.$options.activeClass, shouldActivate);
      this.$emit('should-activate', shouldActivate);
    });

    this.__observer.observe(this.sentinel);
  }

  /**
   * Destroy observer on destroy.
   */
  destroyed() {
    this.__observer.disconnect();
  }
}
