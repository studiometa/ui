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

const effectCache = new Map<string, Function>();

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

  get event() {
    const [event] = this.$options.on.split('.', 1);
    return event;
  }

  get modifiers() {
    return this.$options.on.split('.').slice(1);
  }

  get effect() {
    const { effect } = this.$options;
    if (!effectCache.has(effect)) {
      effectCache.set(effect, new Function('ctx', 'event', 'target', `return ${effect}`));
    }
    return effectCache.get(effect);
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
  handleEvent(event: Event) {
    const { targets, effect, modifiers } = this;

    if (modifiers.includes('prevent')) {
      event.preventDefault();
    }

    if (modifiers.includes('stop')) {
      event.stopPropagation();
    }

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
    const { event, modifiers } = this;

    this.$el.addEventListener(event, this, {
      capture: modifiers.includes('capture'),
      once: modifiers.includes('once'),
      passive: modifiers.includes('passive'),
    });
  }

  /**
   * Destroyed
   */
  destroyed() {
    this.$el.removeEventListener(this.$options.on, this);
  }
}
