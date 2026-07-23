import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractFigure } from './AbstractFigure.js';
import type { AbstractFigureProps } from './AbstractFigure.js';

export interface FigureProps extends AbstractFigureProps {}

/**
 * Figure class.
 *
 * Concrete lazy-loaded image figure built on `AbstractFigure`. It loads the
 * `data-src` source when the element scrolls into view, then terminates itself
 * once the image has loaded, as it has no further work to do after the reveal.
 *
 * @link https://ui.studiometa.dev/components/Figure/
 */
export class Figure<T extends BaseProps = BaseProps> extends AbstractFigure<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractFigure.config,
    name: 'Figure',
  };

  /**
   * Terminate the component on load.
   */
  onLoad() {
    this.$terminate();
  }
}
