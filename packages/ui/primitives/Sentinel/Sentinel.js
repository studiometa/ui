import { Base, withIntersectionObserver } from '@studiometa/js-toolkit';

/**
 * Sentinel class.
 */
export default class Sentinel extends withIntersectionObserver(Base, { threshold: [0, 1] }) {
  /**
   * Config.
   */
  static config = {
    name: 'Sentinel',
    emits: ['sticky-change'],
  };

  /**
   * Emit events based on the root element visibility.
   *
   * @param   {IntersectionObserverEntry[]} entries
   * @returns {void}
   */
  intersected([entry]) {
    this.$emit('sticky-change', entry.isIntersecting && entry.boundingClientRect.y < 0);
  }
}
