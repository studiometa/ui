import { Base, withGroup } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { isArray, nextTick } from '@studiometa/js-toolkit/utils';
import { isInput, isCheckbox, isSelect } from './utils.js';

export interface DataBindProps extends BaseProps {
  $options: {
    prop: string;
    immediate: boolean;
  };
}

/**
 * DataBind class.
 * @link https://ui.studiometa.dev/-/components/DataBind/
 */
export class DataBind<T extends BaseProps = BaseProps> extends withGroup(Base, 'data:')<DataBindProps & T> {
  static config: BaseConfig = {
    name: 'DataBind',
    options: {
      prop: String,
      immediate: Boolean,
    },
  };

  /**
   * Temporary override of the `$group` getter.
   * @todo remove override when https://github.com/studiometa/js-toolkit/issues/680 is fixed.
   */
  get $group() {
    const instances = super.$group as Set<this>;

    for (const instance of instances) {
      if (!instance.$el.isConnected) {
        instances.delete(instance);
      }
    }

    return instances;
  }

  /**
   * @deprecated Use the `$group` getter instead.
   */
  get relatedInstances() {
    return this.$group as Set<this>;
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
      switch (target.type) {
        case 'number':
          return 'valueAsNumber';
        case 'date':
          return 'valueAsDate';
        default:
          return 'value';
      }
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
        const values = [] as string[];
        // @ts-ignore
        for (const option of target.options) {
          if (option.selected) {
            values.push(option.value);
          }
        }

        return values;
      }

      const option = target.options.item(target.selectedIndex);
      return option?.value;
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
    if (this.$options.immediate) {
      nextTick().then(() => {
        this.set(this.get());
      });
    }
  }
}
