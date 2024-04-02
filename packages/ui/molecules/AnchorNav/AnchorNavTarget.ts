import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

export interface AnchorNavTargetProps extends BaseProps {
  $refs: {
    item: HTMLElement[];
  };
}

/**
 * Manage a sticky table section.
 */
export class AnchorNavTarget extends Base<AnchorNavTargetProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AnchorNavTarget',
    refs: ['item[]'],
    options: {
      threshold: { type: String, default: '0.5' },
      rootmargin: { type: String, default: '0% 0px -40% 0px' },
    },
    emits: ['is-intersected'],
  };

  mounted() {
    console.log('mounted');

    const observer = new IntersectionObserver(this.checkIntersection.bind(this), {
      threshold: this.$options.threshold,
      rootMargin: this.$options.rootmargin,
    });
    this.$refs.item.forEach((target) => {
      observer.observe(target);
    });
  }

  checkIntersection(entries) {
    console.log(entries);

    if (entries[0].isIntersecting) {
      let { id } = entries[0].target;
      id = `#${id}`;
      console.log(id);

      this.$emit('is-intersected', id);
    }
  }
}

/**
 * Manage a sticky table section.
 */
// export class AnchorNavTarget extends withIntersectionObserver(Base, {
//   threshold: 0.5,
//   rootMargin: '0% 0px -40% 0px',
// })<AnchorNavTargetProps> {
//   /**
//    * Config.
//    */
//   static config: BaseConfig = {
//     name: 'AnchorNavTarget',
//   };

  // intersected(entries) {
  //   if (entries[0].isIntersecting) {
  //     console.log(this.$options);

  //     let { id } = entries[0].target;
  //     id = `#${id}`;
  //     this.$emit('is-intersected', id);
  //   }
// }
