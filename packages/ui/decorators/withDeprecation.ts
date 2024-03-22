import type {
  Base,
  BaseDecorator,
  BaseProps,
  BaseConfig,
  BaseInterface,
} from '@studiometa/js-toolkit';
import { isDev } from '@studiometa/js-toolkit/utils';

export interface DeprecationProps extends BaseProps {}

export interface DeprecationInterface extends BaseInterface {}

/**
 * Mark a class a deprecated.
 */
export function withDeprecation<S extends Base>(
  BaseClass: typeof Base,
  message?: string,
): BaseDecorator<DeprecationInterface, S, DeprecationProps> {
  /**
   * Class.
   */
  class Deprecated<T extends BaseProps = BaseProps> extends BaseClass<T & DeprecationProps> {
    /**
     * Config.
     */
    static config: BaseConfig = {
      name: 'Deprecated',
    };

    onMounted() {
      if (isDev) {
        console.warn(
          `The ${this.$options.name} component is deprecated.`,
          message ? `\n${message}` : '',
        );
      }
    }
  }

  // @ts-ignore
  return Deprecated;
}
