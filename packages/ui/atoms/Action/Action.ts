import { Base, getInstances } from '@studiometa/js-toolkit';
import { isFunction } from '@studiometa/js-toolkit/utils';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

export interface ActionProps extends BaseProps {
  $options: {
    on: string;
    target: string;
    selector: string;
    effect: string;
  };
}

/**
 * Extract component name and an optional additional selector from a string.
 * @type {RegExp}
 */
const TARGET_REGEX = /([a-zA-Z]+)(\((.*)\))?/;

/**
 * Action class.
 */
export class Action<T extends BaseProps = BaseProps> extends Base<ActionProps & T> {
  static config: BaseConfig = {
    name: 'Action',
    options: {
      on: {
        type: String,
        default: 'click',
      },
      target: String,
      selector: String,
      effect: String,
    },
  };

  get effect() {
    const { effect } = this.$options;
    // @todo add cache for functions, no need to create X times the same function
    const fn = new Function('ctx', 'event', 'target', `return ${effect}`);
    return fn;
  }

  get targets() {
    const { target } = this.$options;
    const parts = target.split(' ').map((part) => {
      const [, name, , selector] = part.match(TARGET_REGEX) ?? [];
      return [name, selector];
    });

    const targets = [] as Array<Record<string, Base>>;

    for (const instance of getInstances()) {
      const { name } = instance.__config;

      for (const part of parts) {
        const shouldPush =
          part[0] === name && (!part[1] || (part[1] && instance.$el.matches(part[1])));
        if (shouldPush) {
          targets.push({ [instance.$options.name]: instance });
        }
      }
    }

    return targets;
  }

  /**
   * Run method on targeted components
   */
  handleEvent(event) {
    const { targets, effect } = this;

    for (const target of targets) {
      try {
        const [name, currentTarget] = Object.entries(target).flat();
        const value = effect(target, event, currentTarget);
        if (typeof value === 'function') {
          value(target, event, currentTarget);
        }
      } catch (err) {
        this.$warn(err);
      }
    }
  }

  /**
   * Mounted
   */
  mounted() {
    const { on: eventName, target } = this.$options;

    if (!target) {
      this.$warn('Missing target options.');
      this.$terminate();
      return;
    }

    this.$el.addEventListener(eventName, this);
  }

  /**
   * Destroyed
   */
  destroyed() {
    this.$el.removeEventListener(this.$options.on, this);
  }
}
