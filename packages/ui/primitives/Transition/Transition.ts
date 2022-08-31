import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig } from '@studiometa/js-toolkit';
import { withTransition } from '../../decorators/index.js';

/**
 * Transition class.
 */
export class Transition extends withTransition(Base) {
  static config: BaseConfig = {
    name: 'Transition',
  }
}
