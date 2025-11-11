import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { AbstractPrefetch } from './AbstractPrefetch.js';

/**
 * PrefetchWhenOver class.
 * @link https://ui.studiometa.dev/components/Prefetch/
 */
export class PrefetchWhenOver<T extends BaseProps = BaseProps> extends AbstractPrefetch<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractPrefetch.config,
    name: 'PrefetchWhenOver',
  };

  /**
   * Prefetch on mouseenter.
   */
  onMouseenter() {
    this.prefetch();
  }
}
