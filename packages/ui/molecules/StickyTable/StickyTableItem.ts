import { Base } from '@studiometa/js-toolkit';
import { scrollTo } from '@studiometa/js-toolkit/utils';


/**
 * Manage a slider item and its state transition.
 */
export class StickyTableItem<T extends BaseProps = BaseProps> extends Base<T & StickyTableProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'StickyTableItem',
    options: {
      id: { type: String, default: 'id' },
    },
  };

  onClick() {
    let sectionId = this.$options.id;
    sectionId = `#${sectionId}`;
    const section = document.querySelector(sectionId);
    scrollTo(section);
  }
}
