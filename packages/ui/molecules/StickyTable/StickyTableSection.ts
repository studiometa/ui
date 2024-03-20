import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

export interface StickyTableSectionProps extends BaseProps {
  $refs: {
    item: HTMLElement[];
  };
}

/**
 * Manage a sticky table section.
 */
export class StickyTableSection extends Base<StickyTableSectionProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'StickyTableSection',
    refs: ['item[]'],
    emits: ['is-intersected'],
  };

  /** TODO use the withIntersectionObserver from js-toolkit or with sentinel from ui */
  mounted() {
    const observer = new IntersectionObserver(this.checkIntersection.bind(this), {
      threshold: 0.8,
    });
    this.$refs.item.forEach((target) => {
      observer.observe(target);
    });
  }

  checkIntersection(entries) {
    if (entries[0].isIntersecting) {
      const { id } = entries[0].target;
      this.$emit('is-intersected', id);
    }
  }
}
