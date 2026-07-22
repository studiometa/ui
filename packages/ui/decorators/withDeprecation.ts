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

    /**
     * Warn about the deprecation once the component is mounted.
     *
     * The warning is wired in the constructor through the `after-mounted`
     * event rather than a `mounted()` hook: js-toolkit calls a single
     * `mounted` method per instance, so a subclass defining its own
     * `mounted()` (like `Modal`) would shadow the decorator and swallow the
     * warning. Subscribing to the event sidesteps that entirely.
     */
    constructor(...args: ConstructorParameters<typeof Base>) {
      super(...args);
      this.$on('after-mounted', () => {
        if (isDev) {
          console.warn(message ?? `The ${this.$options.name} component is deprecated.`);
        }
      });
    }
  }

  // @ts-ignore
  return Deprecated;
}
