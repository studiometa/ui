import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AnchorScrollTo } from '../../atoms/AnchorScrollTo/AnchorScrollTo.js';

export interface StickyTableItemProps extends BaseProps {
  $options: {
    id: string;
  };
}

/**
 * Manage a slider item and its state transition.
 */
export class StickyTableItem extends AnchorScrollTo<StickyTableItemProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AnchorScrollTo.config,
    name: 'StickyTableItem',
  };
}
