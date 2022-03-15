import { AnchorScrollTo } from '../../atoms/index.js';

/**
 * TableOfContentAnchor class.
 */
export default class TableOfContentAnchor extends AnchorScrollTo {
  /**
   * Config.
   */
  static config = {
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
   * Get the sentinel.
   * @returns {HTMLElement}
   */
  get sentinel() {
    return document.querySelector(this.targetSelector);
  }

  /**
   * Init observer on mount.
   * @returns {void}
   */
  mounted() {
    if (!this.sentinel) {
      return;
    }

    this.observer = new IntersectionObserver(([entry]) => {
      const shouldActivate =
        entry.isIntersecting &&
        entry.boundingClientRect.y < 100 &&
        entry.boundingClientRect.y > 100;
      this.$el.classList.toggle(this.$options.activeClass, shouldActivate);
      this.$emit('should-activate', shouldActivate);
    });

    this.observer.observe(this.sentinel);
  }

  /**
   * Destroy observer on destroy.
   *
   * @returns {void}
   */
  destroyed() {
    this.observer.disconnect();
  }
}
