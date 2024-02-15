import { Base } from '@studiometa/js-toolkit';
import { isFunction } from '@studiometa/js-toolkit/utils';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

export interface ActionProps extends BaseProps {
  $options: {
    on: string;
    target: string;
    method: string;
    selector: string;
  };
}

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
      method: String,
      selector: String,
    },
  };

  /**
   * Run method on targeted components
   */
  handleEvent() {
    const { target: componentNames, method, selector } = this.$options;

    let targets = componentNames.includes(' ')
      ? componentNames
          .split(' ')
          .flatMap((componentName) => this.$root.$children?.[componentName] as Base[])
      : (this.$root.$children?.[componentNames] as Base[]);

    if (!targets || !targets.length) {
      return;
    }

    if (selector || selector.length > 0) {
      targets = targets.filter((target) => target.$el.matches(selector));
    }

    targets.forEach((target) => {
      if (!isFunction(target[method])) {
        return;
      }

      target[method]();
    });
  }

  /**
   * Mounted
   */
  mounted() {
    const { on: eventName, target, method } = this.$options;

    if (!target || !method || target.length <= 0 || method.length <= 0) {
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
