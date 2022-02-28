import { Base } from '@studiometa/js-toolkit';
import { scrollTo } from '@studiometa/js-toolkit/utils';

/**
 * AncorScrollTo class.
 */
export default class AncorScrollTo extends Base {
  static config = {
    name: 'AncorScrollTo',
  };

  get targetSelector() {
    return this.$el.hash;
  }

  onClick(event) {
    try {
      scrollTo(this.targetSelector);
      event.preventDefault();
    } catch (err) {}
  }
}
