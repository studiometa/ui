import { Base, withIntersectionObserver } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

export interface AnchorNavTargetProps extends BaseProps {
  $refs: {
    item: HTMLElement[];
  };
}

/**
 * Manage a sticky table section.
 */
export class AnchorNavTarget extends withIntersectionObserver(Base, {
  threshold: 0.5,
  rootMargin: '0% 0px -40% 0px',
})<AnchorNavTargetProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AnchorNavTarget',
    emits: ['is-intersected'],
  };

  intersected(entries) {
    if (entries[0].isIntersecting) {
      let { id } = entries[0].target;
      id = `#${id}`;
      this.$emit('is-intersected', id);
    }
  }
}
