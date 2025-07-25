import { Base, BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { withIndex } from '../decorators/index.js';

/**
 * Indexable class.
 */
export class Indexable<T extends BaseProps = BaseProps> extends withIndex<Base>(Base)<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Indexable',
  };
}
