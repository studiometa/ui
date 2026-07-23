import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { loadImage } from '@studiometa/js-toolkit/utils';
import { AbstractFigure } from './AbstractFigure.js';

export interface AbstractFigureDynamicProps extends BaseProps {
  $options: {
    disable: boolean;
    step: number;
  };
}

/**
 * AbstractFigureDynamic class.
 *
 * Shared base for figures whose source is computed at runtime from the element's
 * rendered size. It extends `AbstractFigure`, defaults the `lazy` option to
 * `true`, and passes the original `data-src` through the overridable `formatSrc`
 * method, unless the `disable` option is set. Its own `formatSrc` returns the
 * source unchanged, so subclasses provide the actual transformation, and on
 * resize it recomputes and reloads the source.
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

    try {
      await loadImage(original);
    } catch {
      this.$warn(`Failed to load image "${original}".`);
      return;
    }

    this.src = original;
  }
}
