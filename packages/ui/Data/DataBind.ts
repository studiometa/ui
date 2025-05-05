import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { isArray } from '@studiometa/js-toolkit/utils';
import { isInput, isCheckbox, isSelect } from './utils.js';

const groups = new Map<string, Set<DataBind>>();

export interface DataBindProps extends BaseProps {
  $options: {
    prop: string;
    group: string;
  };
}

export class DataBind<T extends BaseProps = BaseProps> extends Base<DataBindProps & T> {
  static config: BaseConfig = {
    name: 'DataBind',
    options: {
      prop: String,
      group: String,
    },
  };

  get relatedInstances() {
    const { group } = this.$options;

    const instances = groups.get(group) ?? groups.set(group, new Set()).get(group);

    for (const instance of instances) {
      if (!instance.$el.isConnected) {
        instances.delete(instance);
      }
    }

    return instances;
  }

  get multiple() {
    return this.$options.group.endsWith('[]');
  }

  get target() {
    return this.$el;
  }

  get prop() {
    if (this.$options.prop) {
      return this.$options.prop;
    }

    const { target } = this;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return 'value';
    }

    return 'textContent';
  }

  get value() {
    return this.get();
  }

  set value(value) {
    this.set(value);
  }

  get() {
    const { target, multiple } = this;

    if (isSelect(target)) {
      if (multiple) {
        const values = [];
        // @ts-ignore
        for (const option of target.options) {
          if (option.selected) {
            values.push(option.value);
          }
        }

        return values;
      }

      const option = target.options.item(target.selectedIndex);
      return option.value;
    }

    if (isCheckbox(target)) {
      if (multiple) {
        const values = new Set();
        for (const instance of this.relatedInstances) {
          if (isCheckbox(instance.target) && instance.target.checked) {
            values.add(instance.target.value);
          }
        }
        return Array.from(values);
      } else {
        return target.checked;
      }
    }

    return target[this.prop];
  }

  set(value: boolean | string | string[], dispatch = true) {
    const { target, multiple, relatedInstances } = this;

    if (dispatch) {
      for (const instance of relatedInstances) {
        if (instance !== this && instance.value !== value) {
          instance.set(value, false);
        }
      }
    }

    if (isSelect(target)) {
      // @ts-ignore
      for (const option of target.options) {
        option.selected =
          multiple && isArray(value) ? value.includes(option.value) : option.value === value;
      }
      return;
    }

    if (isInput(target)) {
      switch (target.type) {
        case 'radio':
          target.checked = target.value === value;
          return;
        case 'checkbox':
          target.checked =
            multiple && isArray(value) ? value.includes(target.value) : Boolean(value);
          return;
      }
    }

    target[this.prop] = value;
  }

  mounted() {
    this.relatedInstances.add(this);
  }

  destroyed() {
    this.relatedInstances.delete(this);
  }
}
