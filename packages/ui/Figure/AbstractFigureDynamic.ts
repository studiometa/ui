import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractFigure } from './AbstractFigure.js';
import { loadImage } from './utils.js';

export interface AbstractFigureDynamicProps extends BaseProps {
  $options: {
    disable: boolean;
    step: number;
  };
}

/**
 * AbstractFigureDynamic class.
 */
export class AbstractFigureDynamic<T extends BaseProps = BaseProps> extends AbstractFigure<
  T & AbstractFigureDynamicProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractFigure.config,
    name: 'AbstractFigureDynamic',
    options: {
      ...AbstractFigure.config.options,
      disable: Boolean,
      step: {
        type: Number,
        default: 50,
      },
      lazy: {
        type: Boolean,
        default: true,
      },
    },
  };

  /**
   * Get the formatted source or the original based on the `disable` option.
   */
  get original() {
    return this.$options.disable ? super.original : this.formatSrc(super.original);
  }

  /**
   * Format the source with dynamic parameters.
   */
  /* v8 ignore next 3 */
  formatSrc(src: string): string {
    return src;
  }

  /**
   * Reassign the source from the original on resize.
   */
  async resized() {
    const { original } = this;
    await loadImage(original);
    this.src = original;
  }
}
