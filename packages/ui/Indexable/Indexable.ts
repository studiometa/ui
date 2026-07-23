import { Base, BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { withIndex } from '../decorators/index.js';

/**
 * Indexable class.
 *
 * A primitive built on the `withIndex` decorator that tracks a current index
 * within a total, with configurable boundary behaviour (`clamp`, `loop` or
 * `bounce`). It serves as a base for index-driven components such as sliders
 * and carousels.
 */
export class Indexable<T extends BaseProps = BaseProps> extends withIndex<Base>(Base)<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Indexable',
  };
}
