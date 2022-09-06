// eslint-disable-next-line max-classes-per-file
import { Base, BaseProps } from '@studiometa/js-toolkit';
import type { BaseConfig } from '@studiometa/js-toolkit';
import { withTransition } from '../../decorators/index.js';

/**
 * Transition class.
 */
export class Transition<T extends BaseProps = BaseProps> extends withTransition<Base>(Base)<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Transition',
  };
}
