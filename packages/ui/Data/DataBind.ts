import { Base, withGroup } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { isArray, nextTick } from '@studiometa/js-toolkit/utils';
import { DataScope, getDataScope } from './DataScope.js';
import type { DataValue } from './DataScope.js';
import { isInput, isCheckbox, isSelect } from './utils.js';

export interface DataBindProps extends BaseProps {
  $options: {
    prop: string;
    immediate: boolean;
    key: string;
  };
}

const EMPTY_DATA = Object.freeze({});

/**
 * DataBind class.
 * @link https://ui.studiometa.dev/components/DataBind/
 */
export class DataBind<T extends BaseProps = BaseProps> extends withGroup(Base, 'data:')<DataBindProps & T> {
  static config: BaseConfig = {
    name: 'DataBind',
    options: {
      prop: String,
      immediate: Boolean,
      key: String,
    },
  };

  private __dataScopeResolved = false;
  private __dataScope?: DataScope;

  get dataScope() {
    if (!this.__dataScopeResolved) {
      this.__dataScope = getDataScope(this.$el);
      this.__dataScopeResolved = true;
    }

    return this.__dataScope;
  }

  get group() {
    return this.$options.group || this.dataScope?.$options.group || '';
  }

  override get $group() {
    return this.dataScope?.getGroup(this.group) ?? super.$group;
  }

  /**
   * @deprecated Use the `$group` getter instead.
   */
  get relatedInstances() {
    return this.$group as Set<this>;
  }

  get dataKey() {
    if (!this.dataScope) {
      return '';
    }

    if (this.$options.key) {
      return this.$options.key;
    }

    const { target } = this;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return target.name;
    }

    return '';
  }

  get $data() {
    return this.dataScope?.getData(this.group) ?? EMPTY_DATA;
  }

  get multiple() {
    return this.group.endsWith('[]');
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

  get(): DataValue {
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
        const values = new Set<string>();
        for (const instance of this.relatedInstances) {
          if (
            (!this.dataKey || instance.dataKey === this.dataKey) &&
            isCheckbox(instance.target) &&
            instance.target.checked
          ) {
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

  set(value: DataValue, dispatch = true) {
    if (dispatch && this.dataScope && this.dataKey) {
      this.__dispatchScopedValue(value);
      return;
    }

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

  /**
   * Publish a keyed value to the scoped group and synchronize matching subscribers.
   * @internal
   */
  __dispatchScopedValue(value: DataValue, updateData = true) {
    const { dataScope, dataKey, relatedInstances } = this;

    if (!dataScope || !dataKey) {
      this.set(value);
      return;
    }

    if (updateData) {
      dataScope.setValue(this.group, dataKey, value);
    }

    for (const instance of relatedInstances) {
      if (instance !== this && (!instance.dataKey || instance.dataKey === dataKey)) {
        instance.set(value, false);
      }
    }

    this.set(value, false);
  }

  mounted() {
    if (!this.$options.immediate) {
      return;
    }

    if (this.dataScope && this.dataKey) {
      this.dataScope.hydrate(this.group, this);
      return;
    }

    nextTick().then(() => {
      this.set(this.get());
    });
  }
}
