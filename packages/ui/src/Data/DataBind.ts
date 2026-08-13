import { Base } from '@studiometa/js-toolkit/Base';
import { withGroup } from '@studiometa/js-toolkit/withGroup';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { nextTick } from '@studiometa/js-toolkit/utils/nextTick';
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
import { emitDomUpdate, runWrapped } from '../utils/dom-update.js';

export interface DataBindProps extends BaseProps {
  $options: {
    prop: string;
    immediate: boolean;
    key: string;
  };
}

const EMPTY_DATA = Object.freeze({});

type VirtualBinding =
  | { type: 'text' | 'if'; expression: string }
  | { type: 'prop' | 'attr' | 'class' | 'style'; name: string; expression: string };

/**
 * DataBind class.
 *
 * Part of the reactive Data* family. It creates a binding between a DOM element
 * and a shared value within its Data group — optionally scoped by an enclosing
 * `DataScope` — reflecting values published by the other members of the group
 * onto the element. The bound target defaults to a form control's value or the
 * element's `textContent`, can be overridden with the `prop` option, keyed with
 * the `key` option, and propagated on mount with `immediate`; `data-bind:*`
 * attributes additionally drive an element's property, attribute, class, style,
 * text or — on a `<template>` element — the presence of its content in the DOM
 * from the same value. It also exposes `set`, `toggle`, `increment` and
 * `cycle` helpers to publish changes back to the group.
 *
 * @link https://ui.studiometa.dev/reference/items/DataBind/
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
    emits: ['dom-update'],
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
  __ifNodes?: ChildNode[];
  __ifPresent = false;

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
        const simpleMatch = attribute.name.match(/^data-bind:(text|if)$/);
        if (simpleMatch) {
          this.__virtualBindings.push({
            type: simpleMatch[1] as 'text' | 'if',
            expression: attribute.value,
          });
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
      this.dataScope?.getChannel(this.group) ?? getDataChannel(this.$group as Set<DataScopeMember>)
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
        case 'if':
          this.__applyIfBinding(Boolean(result));
          break;
      }
    }
  }

  /**
   * Toggle the presence of the bound `<template>` content in the DOM. The
   * content is cloned and inserted after the template element when the value
   * is truthy, and removed when the value is falsy. Each insertion is a fresh
   * clone, so any state held by the content is reset on every toggle. Before
   * the change runs, the bubbling `dom-update` protocol event exposes
   * `event.detail.wrap(runner)` so any listener can substitute the function or
   * transitioner that runs the DOM change — to wrap it in a view transition,
   * for example, and give removed content an exit animation. Registration is
   * only valid while the event dispatches — later calls warn and are ignored —
   * and the last registered runner wins. A rejected runner is reported with a
   * warning and never loses the change: the insert or removal runs anyway if
   * the runner did not call `apply()`.
   * @private
   */
  __applyIfBinding(isPresent: boolean) {
    const { target } = this;

    if (!(target instanceof HTMLTemplateElement)) {
      this.$warn(
        'The data-bind:if binding can only be used on a <template> element. Use data-bind:attr.hidden to show or hide an element in place.',
      );
      return;
    }

    if (isPresent === this.__ifPresent) {
      return;
    }

    this.__ifPresent = isPresent;

    // The logical state is tracked synchronously by `__ifPresent` while the
    // DOM change may run later through a runner, so each closure guards on
    // `__ifNodes` to stay a no-op when queued runners apply in sequence.
    const apply = isPresent
      ? () => {
          if (this.__ifNodes) {
            return;
          }
          const fragment = target.content.cloneNode(true) as DocumentFragment;
          this.__ifNodes = [...fragment.childNodes];
          target.after(fragment);
        }
      : () => {
          if (!this.__ifNodes) {
            return;
          }
          for (const node of this.__ifNodes) {
            node.remove();
          }
          this.__ifNodes = undefined;
        };

    const runner = emitDomUpdate(this, { isPresent });

    if (runner) {
      // Intentionally not awaited: the reactive pipeline stays synchronous
      // while the runner defers the DOM change.
      runWrapped(this, runner, apply);
    } else {
      apply();
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
      isCheckbox(this.target) && (typeof onValue !== 'boolean' || typeof offValue !== 'boolean');

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
      if (this.isDataSource) {
        this.dataScope.hydrate(this.group, this);
        return;
      }

      // Subscribers mounted after hydration — content inserted by `data-bind:if`
      // or any other DOM update — sync from the current scoped value; on first
      // load the value is not collected yet and arrives through the
      // post-hydration dispatch.
      const data = this.$data;
      if (this.dataKey in data) {
        this.set(data[this.dataKey], false);
      }
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
