import { Base, withGroup } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { isArray, nextTick } from '@studiometa/js-toolkit/utils';
import { DataScope, getDataScope } from './DataScope.js';
import type { DataValue } from './DataScope.js';
import { getCallback, isInput, isCheckbox, isSelect } from './utils.js';

export interface DataBindProps extends BaseProps {
  $options: {
    prop: string;
    immediate: boolean;
    key: string;
  };
}

const EMPTY_DATA = Object.freeze({});

function valuesEqual(left: DataValue, right: DataValue) {
  if (Object.is(left, right)) {
    return true;
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime();
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((value, index) => value === right[index])
    );
  }

  return String(left) === String(right);
}

type VirtualBinding =
  | { type: 'text'; expression: string }
  | { type: 'prop' | 'attr' | 'class' | 'style'; name: string; expression: string };

function resolvePropertyName(target: HTMLElement, name: string) {
  const normalizedName = name.replaceAll('-', '').toLowerCase();
  let current: object | null = target;

  while (current) {
    const property = Object.getOwnPropertyNames(current).find(
      (candidate) => candidate.toLowerCase() === normalizedName,
    );
    if (property) {
      return property;
    }
    current = Object.getPrototypeOf(current);
  }

  return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * DataBind class.
 * @link https://ui.studiometa.dev/components/DataBind/
 */
export class DataBind<T extends BaseProps = BaseProps> extends withGroup(Base, 'data:')<
  DataBindProps & T
> {
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
  private __virtualBindings?: VirtualBinding[];
  private __virtualValue?: DataValue;
  private __hasVirtualValue = false;

  get virtualBindings() {
    if (!this.__virtualBindings) {
      this.__virtualBindings = [];

      for (const attribute of this.$el.attributes) {
        if (attribute.name === 'data-bind:text') {
          this.__virtualBindings.push({ type: 'text', expression: attribute.value });
          continue;
        }

        const match = attribute.name.match(/^data-bind:(prop|attr|class|style)\.(.+)$/);
        if (match) {
          this.__virtualBindings.push({
            type: match[1] as 'prop' | 'attr' | 'class' | 'style',
            name: match[2],
            expression: attribute.value,
          });
        }
      }
    }

    return this.__virtualBindings;
  }

  get hasVirtualBindings() {
    return this.virtualBindings.length > 0;
  }

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
    if (this.hasVirtualBindings && this.__hasVirtualValue) {
      return this.__virtualValue;
    }

    return this.getTargetValue();
  }

  protected getTargetValue(): DataValue {
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
        if (instance !== this && (instance.hasVirtualBindings || instance.value !== value)) {
          instance.set(value, false);
        }
      }
    }

    if (this.hasVirtualBindings) {
      this.__virtualValue = value;
      this.__hasVirtualValue = true;
      this.applyVirtualBindings(value);
      return;
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

  private applyVirtualBindings(value: DataValue) {
    for (const binding of this.virtualBindings) {
      let result: unknown = value;

      if (binding.expression) {
        try {
          result = getCallback(this.group, `return ${binding.expression};`)(
            value,
            this.target,
            this.$data,
          );
        } catch (error) {
          // @todo better handling of errors?
          console.error('Failed', error);
          continue;
        }
      }

      switch (binding.type) {
        case 'prop':
          this.target[resolvePropertyName(this.target, binding.name)] = result;
          break;
        case 'attr':
          if (result === false || result === null || result === undefined) {
            this.target.removeAttribute(binding.name);
          } else {
            this.target.setAttribute(binding.name, result === true ? '' : String(result));
          }
          break;
        case 'class':
          this.target.classList.toggle(binding.name, Boolean(result));
          break;
        case 'style':
          this.target.style.setProperty(
            binding.name,
            result === false || result === null || result === undefined ? '' : String(result),
          );
          break;
        case 'text':
          this.target.textContent = result as string | null;
          break;
      }
    }
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
      dataScope.setValue(this.group, dataKey, value, this);
    }

    for (const instance of relatedInstances) {
      if (instance !== this && (!instance.dataKey || instance.dataKey === dataKey)) {
        instance.set(value, false);
      }
    }

    this.set(value, false);
  }

  toggle(onValue: DataValue = true, offValue: DataValue = false) {
    const isRadio = isInput(this.target) && this.target.type === 'radio';
    const hasCustomCheckboxValues =
      isCheckbox(this.target) &&
      (typeof onValue !== 'boolean' || typeof offValue !== 'boolean');

    if (isRadio || hasCustomCheckboxValues) {
      this.$warn('The toggle() values can not be represented by this input.');
      return;
    }

    this.set(valuesEqual(this.value, onValue) ? offValue : onValue);
  }

  increment(step = 1) {
    if (isInput(this.target) && this.target.type === 'date') {
      this.$warn('The increment() method can not be used with date inputs.');
      return;
    }

    const value = Number(this.value);
    this.set((Number.isNaN(value) ? 0 : value) + step);
  }

  cycle(values: readonly DataValue[]) {
    if (values.length === 0) {
      return;
    }

    const index = values.findIndex((value) => valuesEqual(value, this.value));
    this.set(values[(index + 1) % values.length]);
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

  destroyed() {
    if (this.dataScope && this.dataKey) {
      this.dataScope.deleteValue(this.group, this.dataKey, this);
    }
  }
}
