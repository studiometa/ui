import { Base, withIntersectionObserver } from '@studiometa/js-toolkit';
import type { BaseConfig } from '@studiometa/js-toolkit';

/**
 * Sentinel class.
 * @link https://ui.studiometa.dev/components/Sentinel/
 */
export class Sentinel extends withIntersectionObserver(Base, { threshold: [0, 1] }) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Sentinel',
  };
}
