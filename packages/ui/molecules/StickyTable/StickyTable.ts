import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { StickyTableItem } from './StickyTableItem.js';
import { StickyTableSection } from './StickyTableSection.js';

/**
 * @typedef {object} StickyTableRefs
 * @property {HTMLElement} tableItem
 * @property {HTMLElement}
 */

export interface StickyTableProps extends BaseProps {
  $children: {
    StickyTableItem: StickyTableItem[];
    StickyTableSection: StickyTableSection[];
  };
}

export class StickyTable<T extends BaseProps = BaseProps> extends Base<T & StickyTableProps> {
  /**
   * Config
   */
  static config: BaseConfig = {
    name: 'StickyTable',
    components: {
      StickyTableItem,
      StickyTableSection,
    },
  };

  /**
   * Listen to the stickyTable that is intersected
   */
  onStickyTableSectionIsIntersected(id) {
    if (document.querySelector('.current')) {
      document.querySelector('.current').classList.remove('current');
    }
    const currentStickyTableItem = this.$children.StickyTableItem.find(
      (stickyTableItem) => stickyTableItem.$options.id === id,
    );
    currentStickyTableItem.$el.classList.add('current');
  }
}
