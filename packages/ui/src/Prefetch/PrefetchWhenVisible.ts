import type { BaseConfig } from '@studiometa/js-toolkit';
import { AbstractPrefetch } from './AbstractPrefetch.js';

/**
 * Prefetches the link's URL the first time it enters the viewport.
 *
 * The strategy is `visible` and not `in-view`, because the intent is one-shot:
 * `in-view` would unmount and remount on every crossing and re-hint a URL the
 * browser already holds.
 *
 * @link https://ui.studiometa.dev/reference/items/Prefetch/
 */
export class PrefetchWhenVisible extends AbstractPrefetch {
  static config: BaseConfig = { name: 'PrefetchWhenVisible', mountStrategy: 'visible' };

  mounted(): void {
    this.prefetch();
  }
}
