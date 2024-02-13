import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

export interface ActionProps extends BaseProps {
  $options: {
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
      target: String,
      method: String,
      selector: String,
    },
  };

  /**
   * Mounted
   */
  mounted() {
    const { target, method } = this.$options;

    if (!target || !method || target.length <= 0 || method.length <= 0) {
      this.$terminate();
    }
  }

  /**
   * On component click
   */
  onClick() {
    const { target: name, method, selector } = this.$options;

    let targets = this.$root.$children[name] as Base[];

    if (!targets || targets.length <= 0) {
      return;
    }

    if (selector || selector.length > 0) {
      targets = targets.filter((target) => target.$el.matches(selector));
    }

    if (!targets || targets.length <= 0) {
      return;
    }

    targets.forEach((target) => {
      if (!target[method]) {
        return;
      }

      target[method]();
    });
  }
}
