import {
  Base,
  type BaseConfig,
  type BaseConstructor,
  type MixedClass,
  type MountedReturn,
} from '@studiometa/js-toolkit';

/**
 * What the mixin adds to the class it wraps: nothing a consumer can call. The
 * whole behaviour is the warning, and it fires by itself.
 */
export interface DeprecationInterface {}

/**
 * v1 declared a `DeprecationProps` next to the interface. The mixin reads no
 * option and declares no ref, so that type was empty in v1 too; it stays as an
 * alias so an existing import keeps resolving.
 */
export type DeprecationProps = Record<never, never>;

/**
 * Mark a component as deprecated: every instance warns once when it mounts.
 *
 * Two things changed from v1. The warning goes to `$warn()`, the diagnostic
 * channel, instead of a `console.warn` behind an `isDev` check — v4 has no
 * `isDev` and the channel decides for itself whether anything is printed. And
 * the hook is a plain `mounted()` rather than v1's `after-mounted` listener
 * wired from the constructor, because chaining `super.mounted()` is the v4
 * mixin contract: every core service mixin binds from `mounted()` too.
 */
export function withDeprecation<T extends BaseConstructor>(
  BaseClass: T,
  message?: string,
): MixedClass<T, DeprecationInterface> {
  // Typed against the concrete `Base` rather than the public signature's type
  // parameter, and cast on the way out — the split `withTransition()` and
  // core's own `createServiceMixin()` use, for the same reason: a class that
  // extends a *type parameter* must declare `constructor(...args: any[])`,
  // which would add a constructor this mixin does not need.
  class Deprecated extends (BaseClass as unknown as typeof Base) {
    /**
     * Typed rather than spelled with a `name`: `BaseConfig` requires one, and a
     * name set here would be inherited by any consumer that declared none,
     * registering it under a name it never chose.
     */
    static config = {} as BaseConfig;

    /**
     * Whether this instance has already warned. A v4 move is a destroy plus a
     * mount of the same instance, and one deprecation notice per element is
     * enough.
     * @private
     */
    __hasWarned = false;

    mounted(): MountedReturn {
      if (!this.__hasWarned) {
        this.__hasWarned = true;
        const name = (this.constructor as unknown as { config: BaseConfig }).config.name;
        const notice = `The ${name} component is deprecated.`;
        this.$warn('ui.deprecated', message ? `${notice} ${message}` : notice);
      }

      return super.mounted?.();
    }
  }

  return Deprecated as unknown as MixedClass<T, DeprecationInterface>;
}
