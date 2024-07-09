import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { isArray } from '@studiometa/js-toolkit/utils';
import { isInput, isRadio, isCheckbox, isSelect } from './utils.js';

const defaultProp = Symbol('default');

const instances = new Map<string, Set<DataBind>>();

export interface DataBindProps extends BaseProps {
  $options: {
    prop: string | Symbol;
    name: string;
    target: string;
    main: boolean;
  };
}

export class DataBind<T extends BaseProps = BaseProps> extends Base<DataBindProps & T> {
  static config: BaseConfig = {
    name: 'DataBind',
    options: {
      prop: {
        type: String,
        default: defaultProp,
      },
      name: String,
      target: String,
      main: Boolean,
    },
  };

  static get instances() {
    return instances;
  }

  get relatedInstances() {
    const { name } = this.$options;

    if (!instances.has(name)) {
      instances.set(name, new Set());
    }

    return instances.get(name);
  }

  get main() {
    for (const instance of this.relatedInstances) {
      if (instance.$options.main) {
        return instance;
      }
    }

    return this.relatedInstances.values().next().value;
  }

  get multiple() {
    return this.$options.name.endsWith('[]');
  }

  get target() {
    const target = this.$refs[this.$options.target] ?? this.$el;
    return isArray(target) ? target[0] : target;
  }

  get prop() {
    if (this.$options.prop !== defaultProp) {
      return this.$options.prop as string;
    }

    const { target } = this;
    if (target instanceof HTMLInputElement) {
      return 'value';
    }

    return 'textContent';
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
        const values = [];
        for (const instance of this.relatedInstances) {
          if (instance.target instanceof HTMLInputElement && instance.target.type === 'checkbox' && instance.target.checked) {
            values.push(instance.target.value ?? instance.target.textContent);
          }
        }
        return values;
      } else {
        return target.checked;
      }
    }

    return target[this.prop];
  }

  set(value) {
    const { target, multiple } = this;

    if (isSelect(target)) {
      for (const option of target.options) {
        option.selected = multiple ? value.includes(option.value) : option.value === value;
      }
      return;
    }

    if (isInput(target)) {
      switch (target.type) {
        case 'radio':
          target.checked = target.value === value;
          return;
        case 'checkbox':
          target.checked = multiple ? value.includes(target.value) : value;
          return;
      }
    }

    target[this.prop] = value;
  }

  mounted() {
    this.relatedInstances.add(this);

    if (this !== this.main) {
      this.set(this.main.get());
    } else {
      this.set(this.get());
    }
  }

  destroyed() {
    this.relatedInstances.delete(this);
  }
}
