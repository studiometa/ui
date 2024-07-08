import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

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

      if (
        instance.$el instanceof HTMLInputElement &&
        ['radio', 'checkbox'].includes(instance.$el.type) &&
        instance.$el.checked
      ) {
        return instance;
      }
    }

    return this.relatedInstances.values().next().value;
  }

  get target() {
    return this.$refs[this.$options.target] ?? this.$el;
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

  get value() {
    return this.get();
  }

  set value(value) {
    for (const instance of this.relatedInstances) {
      instance.set(value);
    }
  }

  get() {
    if (this.target instanceof HTMLSelectElement) {
      const option = this.target.options.item(this.target.selectedIndex);
      return option.value || option.textContent;
    }

    return this.target[this.prop];
  }

  set(value) {
    if (this.target instanceof HTMLSelectElement) {
      for (const option of this.target.options) {
        option.selected = option.value === value;
      }
      return;
    }

    if (this.target instanceof HTMLInputElement && this.target.type == 'radio') {
      this.target.checked = this.target.value === value;
      return;
    }

    this.target[this.prop] = value;
  }

  mounted() {
    this.relatedInstances.add(this);

    if (this !== this.main) {
      this.value = this.main.get();
    } else {
      this.value = this.get();
    }
  }

  destroyed() {
    this.relatedInstances.delete(this);
  }
}
