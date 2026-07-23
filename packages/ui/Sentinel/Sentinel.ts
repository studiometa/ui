import { Base, withIntersectionObserver } from '@studiometa/js-toolkit';
import type { BaseConfig } from '@studiometa/js-toolkit';

/**
 * Sentinel class.
 *
 * A minimal marker element that reports its own viewport intersection. Built on the
 * `withIntersectionObserver` decorator with a `[0, 1]` threshold, it emits the decorator's
 * `intersected` event so a parent component (such as `Sticky`) can react to the element
 * entering or leaving the viewport.
 *
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
