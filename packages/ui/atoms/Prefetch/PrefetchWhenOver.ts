import type { BaseTypeParameter, BaseConfig } from '@studiometa/js-toolkit';
import { AbstractPrefetch } from './AbstractPrefetch.js';

/**
 * PrefetchWhenOver class.
 */
export class PrefetchWhenOver<
  T extends BaseTypeParameter = BaseTypeParameter,
> extends AbstractPrefetch<T> {
  /**
   * Config.
   */
  static config:BaseConfig = {
    ...AbstractPrefetch.config,
    name: 'PrefetchWhenOver',
  };

  /**
   * Prefetch on mouseenter.
   */
  onMouseenter() {
    this.prefetch(new URL(this.$el.href));
  }
}
