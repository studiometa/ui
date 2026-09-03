import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractFigure, type AbstractFigureProps } from './AbstractFigure.js';

export type FigureProps = AbstractFigureProps;

/**
 * Concrete lazy-loaded image figure built on `AbstractFigure`. It loads the
 * `data-src` source when the element scrolls into view, running the enter
 * transition and emitting `load` once it is ready.
 *
 * Nothing has to stop the component once the reveal has run:
 * `AbstractFigure.mounted()` only loads when `src !== this.src`, which is
 * already false once loaded, so the remount the `in-view` strategy can trigger
 * is a no-op on its own.
 *
 * @link https://ui.studiometa.dev/reference/items/Figure/
 */
export class Figure<T extends BaseProps = BaseProps> extends AbstractFigure<T> {
  static config: BaseConfig = {
    ...AbstractFigure.config,
    name: 'Figure',
  };
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Figure`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Figure;
