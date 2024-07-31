import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { isArray } from '@studiometa/js-toolkit/utils';
import { isInput, isCheckbox, isSelect } from './utils.js';

const instances = new Map<string, Set<DataBind>>();

export interface DataBindProps extends BaseProps {
  $options: {
    prop: string;
    name: string;
  };
}

export class DataBind<T extends BaseProps = BaseProps> extends Base<DataBindProps & T> {
  static config: BaseConfig = {
    name: 'DataBind',
    options: {
      prop: String,
      name: String,
    },
  };

  get relatedInstances() {
    const { name } = this.$options;

    if (!instances.has(name)) {
      instances.set(name, new Set());
    }

    return instances.get(name);
  }

  get multiple() {
    return this.$options.name.endsWith('[]');
  }

  get target() {
    return this.$el;
  }

  get prop() {
    if (this.$options.prop) {
      return this.$options.prop;
    }

    const { target } = this;
    if (target instanceof HTMLInputElement) {
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

  set(value: boolean | string | string[]) {
    const { target, multiple } = this;

    if (isSelect(target)) {
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
