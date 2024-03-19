import { Base } from '@studiometa/js-toolkit';

/**
 * Manage a sticky table section.
 */
export class StickyTableSection<T extends BaseProps = BaseProps> extends Base<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'StickyTableSection',
    refs: ['item[]'],
    emits: ['is-intersected'],
  };

  /** TODO use the withIntersectionObserver from js-toolkit */
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
