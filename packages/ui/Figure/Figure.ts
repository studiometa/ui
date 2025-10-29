import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractFigure } from './AbstractFigure.js';
import type { AbstractFigureProps } from './AbstractFigure.js';

export interface FigureProps extends AbstractFigureProps {}

/**
 * Figure class.
 * @link https://ui.studiometa.dev/-/components/Figure/
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
