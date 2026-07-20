import { Base, withGroup } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { nextTick } from '@studiometa/js-toolkit/utils';
import { getDataChannel } from './DataChannel.js';
import { DataScope, getDataScope, DATA_GROUP_NAMESPACE } from './DataScope.js';
import type { DataScopeMember, DataValue } from './DataScope.js';
import {
  type DataControlContext,
  isCheckbox,
  isInput,
  readControlValue,
  resolvePropertyName,
  setProperty,
  valuesEqual,
  writeControlValue,
} from './formControl.js';
import { getCallback } from './utils.js';

export interface DataBindProps extends BaseProps {
  $options: {
    prop: string;
    immediate: boolean;
    key: string;
  };
}

const EMPTY_DATA = Object.freeze({});

type VirtualBinding =
  | { type: 'text'; expression: string }
  | { type: 'prop' | 'attr' | 'class' | 'style'; name: string; expression: string };

/**
 * DataBind class.
 * @link https://ui.studiometa.dev/components/DataBind/
 */
export class DataBind<T extends BaseProps = BaseProps> extends withGroup<Base, DataScope>(
  Base,
  DATA_GROUP_NAMESPACE,
  {
    getScope: (instance) => getDataScope(instance.$el),
    getGroup: (instance, scope) =>
      (instance.$options as { group?: string }).group || scope?.$options.group || '',
  },
)<DataBindProps & T> {
  static config: BaseConfig = {
    name: 'DataBind',
    options: {
      prop: String,
      immediate: Boolean,
      key: String,
    },
  };

  __dataScopeResolved = false;
  __dataScope?: DataScope;
  __stopUpdates?: () => void;
  __virtualBindings?: VirtualBinding[];
  __virtualValue?: DataValue;
  __hasVirtualValue = false;

  get isDataSource() {
    return false;
  }

  /**
   * @protected
   */
  get __supportsMutations() {
    return true;
  }

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

  /**
   * @private
   */
  get __channel() {
    return (
      this.dataScope?.getChannel(this.group) ??
      getDataChannel(this.$group as Set<DataScopeMember>)
    );
  }

  /**
   * @protected
   */
  get __controlContext(): DataControlContext {
    return {
      dataKey: this.dataKey,
      members: this.relatedInstances,
      multiple: this.multiple,
      prop: this.prop,
      target: this.target,
    };
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

    return this.__getTargetValue();
  }

  /**
   * @protected
   */
  __getTargetValue(): DataValue {
    return readControlValue(this.__controlContext);
  }

  set(value: DataValue, dispatch = true) {
    const publication = dispatch ? this.__publishValue(value) : undefined;

    if (!publication || publication.channel.isCurrent(publication.frame)) {
      this.__applyValue(value);
    }
  }

  /**
   * @private
   */
  __applyValue(value: DataValue) {
    if (this.hasVirtualBindings) {
      this.__virtualValue = value;
      this.__hasVirtualValue = true;
      this.__applyVirtualBindings(value);
      return;
    }

    writeControlValue(this.__controlContext, value);
  }

  /**
   * Publish a value to the resolved Data group without applying it locally.
   * @protected
   */
  __publishValue(value: DataValue, force = false, updateData = true) {
    if (this.dataScope && this.dataKey) {
      if (updateData) {
        this.dataScope.setValue(this.group, this.dataKey, value, this);
      }

      const channel = this.dataScope.getChannel(this.group);
      const frame = channel.publish({
        force: true,
        key: this.dataKey,
        source: this,
        value,
      });
      return { channel, frame };
    }

    const channel = this.__channel;
    const frame = channel.publish({
      force,
      source: this,
      value,
    });
    return { channel, frame };
  }

  /**
   * @private
   */
  __applyVirtualBindings(value: DataValue) {
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
          setProperty(this.target, resolvePropertyName(this.target, binding.name), result);
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
          this.target.textContent = (result ?? '') as string;
          break;
      }
    }
  }

  /**
   * Publish a keyed value to the scoped group and synchronize matching subscribers.
   * @internal
   */
  __dispatchScopedValue(value: DataValue, updateData = true) {
    const publication = this.__publishValue(value, true, updateData);

    if (publication.channel.isCurrent(publication.frame)) {
      this.set(value, false);
    }
  }

  /**
   * @private
   */
  __validateMutation(method: string) {
    if (this.__supportsMutations) {
      return true;
    }

    this.$warn(`The ${method}() method can not be used with this component.`);
    return false;
  }

  toggle(onValue: DataValue = true, offValue: DataValue = false) {
    if (!this.__validateMutation('toggle')) {
      return;
    }

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
    if (!this.__validateMutation('increment')) {
      return;
    }

    if (isInput(this.target) && this.target.type === 'date') {
      this.$warn('The increment() method can not be used with date inputs.');
      return;
    }

    const value = Number(this.value);
    this.set((Number.isNaN(value) ? 0 : value) + step);
  }

  cycle(values: readonly DataValue[]) {
    if (!this.__validateMutation('cycle') || values.length === 0) {
      return;
    }

    const index = values.findIndex((value) => valuesEqual(value, this.value));
    this.set(values[(index + 1) % values.length]);
  }

  mounted() {
    this.__stopUpdates?.();
    this.__stopUpdates = this.__channel.subscribe((update) => {
      if (!this.$el.isConnected) {
        this.__stopUpdates?.();
        this.__stopUpdates = undefined;
        return;
      }

      if (
        update.source !== this &&
        (!update.key || !this.dataKey || update.key === this.dataKey) &&
        (update.force || this.hasVirtualBindings || this.value !== update.value)
      ) {
        this.set(update.value, false);
      }
    });

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
    this.__stopUpdates?.();
    this.__stopUpdates = undefined;

    if (this.dataScope && this.dataKey) {
      this.dataScope.deleteValue(this.group, this.dataKey, this);
    }
  }
}
