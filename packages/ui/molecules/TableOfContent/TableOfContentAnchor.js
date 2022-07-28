import { AnchorScrollTo } from '../../atoms/index.js';
import withTransition from '../../decorators/withTransition.js';

/**
 * TableOfContentAnchor class.
 */
export default class TableOfContentAnchor extends withTransition(AnchorScrollTo) {
  /**
   * Config.
   */
  static config = {
    name: 'TableOfContentAnchor',
    emits: ['is-visible', 'is-hidden'],
    options: {
      sentinelSelector: String,
    },
  };

  /**
   * Wether the component is intersecting or not.
   * @type {Boolean}
   */
  isIntersecting = false;

  /**
   * Get the sentinel.
   * @returns {HTMLElement}
   */
  get sentinel() {
    return document.querySelector(this.$options.sentinelSelector || this.targetSelector);
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
      this.isIntersecting = entry.isIntersecting;
      this.$emit(entry.isIntersecting ? 'is-visible' : 'is-hidden');
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
