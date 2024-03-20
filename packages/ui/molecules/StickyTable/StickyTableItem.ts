import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { scrollTo } from '@studiometa/js-toolkit/utils';

export interface StickyTableItemProps extends BaseProps {
  $options: {
    id: string;
  };
}

/**
 * Manage a slider item and its state transition.
 */
export class StickyTableItem extends Base<StickyTableItemProps> {
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
