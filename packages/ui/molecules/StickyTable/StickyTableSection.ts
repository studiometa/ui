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
    options: {
      threshold: { type: String, default: '0.5' },
      rootmargin: { type: String, default: '0% 0px -40% 0px' },
    },
    emits: ['is-intersected'],
  };

  /** TODO use the withIntersectionObserver from js-toolkit or with sentinel from ui */
  mounted() {
    const observer = new IntersectionObserver(this.checkIntersection.bind(this), {
      threshold: this.$options.threshold,
      rootMargin: this.$options.rootmargin,
    });
    this.$refs.item.forEach((target) => {
      observer.observe(target);
    });
  }

  checkIntersection(entries) {
    if (entries[0].isIntersecting) {
      console.log(this.$options);

      let { id } = entries[0].target;
      id = `#${id}`;
      this.$emit('is-intersected', id);
    }
  }
}
