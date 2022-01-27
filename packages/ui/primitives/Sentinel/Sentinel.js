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
  };
}
