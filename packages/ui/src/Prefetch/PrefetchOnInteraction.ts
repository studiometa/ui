import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractPrefetch } from './AbstractPrefetch.js';

/**
 * Prefetches the link's URL when a pointer, a touch or the keyboard reaches it.
 *
 * The whole variant is the mount strategy: `interaction` mounts on
 * `pointerenter`, `pointerdown` or `focusin`, whichever comes first, and never
 * before. The strategy decides **when**, the base decides **what**. Covering
 * the three events rather than `mouseenter` alone is what makes the hint reach
 * a touch or a keyboard user too.
 *
 * @link https://ui.studiometa.dev/reference/items/Prefetch/
 */
export class PrefetchOnInteraction<T extends BaseProps = BaseProps> extends AbstractPrefetch<T> {
  static config: BaseConfig = { name: 'PrefetchOnInteraction', mountStrategy: 'interaction' };

  mounted(): void {
    this.prefetch();
  }
}
