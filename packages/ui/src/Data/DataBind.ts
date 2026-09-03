import { Base } from '@studiometa/js-toolkit/Base';
import { defaultScheduler } from '@studiometa/js-toolkit/defaultScheduler';
import { domUpdate } from '@studiometa/js-toolkit/domUpdate';
import { subscribeContext } from '@studiometa/js-toolkit/subscribeContext';
import { watchAttributeNamespace } from '@studiometa/js-toolkit/watchAttributeNamespace';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { getCallback } from './expression.js';
import {
  isCheckbox,
  isInput,
  readControlValue,
  resolvePropertyName,
  setProperty,
  valuesEqual,
  writeControlValue,
  type DataControlContext,
} from './formControl.js';
import {
  DataRegistryContext,
  resolveDataRegistry,
  type DataRegistry,
  type DataScopeMember,
  type DataUpdate,
  type DataValue,
} from './registry.js';

// An interface lacks the implicit index signature required by `BaseProps`.
export type DataBindOptions = {
  prop: string;
  immediate: boolean;
  key: string;
  group: string;
};

export type DataBindProps = BaseProps & {
  $options: DataBindOptions;
};

/**
 * The namespace a virtual binding is declared by. Its qualifier head is finite
 * — the six binding types — while the name a `prop`, `attr`, `class` or `style`
 * binding carries after the dot is open, so the set of names is **not**
 * enumerable and the namespace is watched rather than registered. The finite
 * head is still worth declaring: it is what turns `data-bind:prpo.value` into a
 * warning instead of an attribute silently doing nothing.
 */
const BIND_NAMESPACE = 'data-bind';

/** The qualifier heads that take no name. */
const SIMPLE_BINDINGS = ['text', 'if'] as const;

/** The qualifier heads that name what they write to. */
const NAMED_BINDINGS = ['prop', 'attr', 'class', 'style'] as const;

const BIND_QUALIFIERS = [...SIMPLE_BINDINGS, ...NAMED_BINDINGS];

type SimpleBinding = (typeof SIMPLE_BINDINGS)[number];

type NamedBinding = (typeof NAMED_BINDINGS)[number];

type VirtualBinding =
  | { type: SimpleBinding; expression: string }
  | { type: NamedBinding; name: string; expression: string };

/** A two-way binding between an element and a named data group. */
/**
 * Stringify whatever the author's expression returned, objects included — the
 * same contract `v-bind` has. The default `[object Object]` form is the
 * intended output here, not an oversight.
 */
// oxlint-disable-next-line typescript/no-base-to-string
const bindingText = (result: unknown): string => String(result);

export class DataBind<T extends BaseProps = DataBindProps>
  extends Base<DataBindProps & T>
  implements DataScopeMember
{
  static config: BaseConfig = {
    name: 'DataBind',
    options: {
      prop: String,
      immediate: Boolean,
      key: String,
      group: String,
    },
  };

  /** Lazily resolved before mount and updated when the nearest scope changes. @private */
  __registry?: DataRegistry;

  /** Undoes `__connect()`. `undefined` while disconnected. @private */
  __leaveGroup?: () => void;

  /**
   * Live bindings by the attribute that declared them. Kept in step with the
   * element rather than memoised: a `data-bind:*` rewritten in place would
   * otherwise keep its first parse forever, which is what
   * `watchAttributeNamespace()` exists to prevent.
   */
  __virtualBindings = new Map<string, VirtualBinding>();

  __virtualValue?: DataValue;

  __hasVirtualValue = false;

  __ifNodes?: ChildNode[];

  __ifPresent = false;

  /**
   * Whether this component's value is one the scope should hydrate from.
   * `DataModel` says yes; a plain binding is a subscriber.
   */
  get isDataSource(): boolean {
    return false;
  }

  /**
   * Whether `toggle()` / `increment()` / `cycle()` make sense here.
   * @protected
   */
  get supportsMutations(): boolean {
    return true;
  }

  get dataRegistry(): DataRegistry {
    this.__registry ??= resolveDataRegistry(this.$el);
    return this.__registry;
  }

  get group(): string {
    return this.$options.group || this.dataRegistry.defaultGroup || '';
  }

  /** The live peer set for the resolved group. */
  get peers(): Set<DataScopeMember> {
    return this.dataRegistry.members(this.group);
  }

  get dataKey(): string {
    if (!this.dataRegistry.scoped) {
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

  get $data(): Readonly<Record<string, DataValue>> {
    return this.dataRegistry.getData(this.group);
  }

  get multiple(): boolean {
    return this.group.endsWith('[]');
  }

  /** @protected */
  get controlContext(): DataControlContext {
    return {
      dataKey: this.dataKey,
      members: this.peers,
      multiple: this.multiple,
      prop: this.prop,
      target: this.target,
    };
  }

  get target(): HTMLElement {
    return this.$el;
  }

  get prop(): string {
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

  get virtualBindings(): VirtualBinding[] {
    return [...this.__virtualBindings.values()];
  }

  get hasVirtualBindings(): boolean {
    return this.__virtualBindings.size > 0;
  }

  /**
   * One `data-bind:<type>[.<name>]` qualifier. The head is validated by the
   * namespace, so what is left here is the grammar's own rule: the first part
   * names what a named binding writes to, and a head which takes no name
   * carries no part.
   * @private
   */
  __parseQualifier(qualifier: string, expression: string): VirtualBinding | undefined {
    const separator = qualifier.indexOf('.');
    const head = separator === -1 ? qualifier : qualifier.slice(0, separator);
    const name = separator === -1 ? '' : qualifier.slice(separator + 1);

    if ((SIMPLE_BINDINGS as readonly string[]).includes(head)) {
      return name ? undefined : { type: head as SimpleBinding, expression };
    }

    return name ? { type: head as NamedBinding, name, expression } : undefined;
  }

  get value(): DataValue {
    return this.get();
  }

  set value(value: DataValue) {
    this.set(value);
  }

  get(): DataValue {
    if (this.hasVirtualBindings && this.__hasVirtualValue) {
      return this.__virtualValue;
    }

    return this.getTargetValue();
  }

  /** @protected */
  getTargetValue(): DataValue {
    return readControlValue(this.controlContext);
  }

  set(value: DataValue, dispatch = true): void {
    const publication = dispatch ? this.publishValue(value) : undefined;

    if (!publication || this.dataRegistry.isCurrent(publication.group, publication.frame)) {
      this.applyValue(value);
    }
  }

  /**
   * Publish to the resolved group without applying locally.
   * @protected
   */
  publishValue(
    value: DataValue,
    force = false,
    updateData = true,
  ): { group: string; frame: DataUpdate } {
    const registry = this.dataRegistry;
    const { group } = this;

    // Equal keyed values remain observable events.
    if (registry.scoped && this.dataKey) {
      if (updateData) {
        registry.setValue(group, this.dataKey, value, this);
      }
      return {
        group,
        frame: registry.publish(group, {
          force: true,
          key: this.dataKey,
          source: this,
          value,
        }),
      };
    }

    return { group, frame: registry.publish(group, { force, source: this, value }) };
  }

  /**
   * Publish a keyed value and synchronize matching subscribers.
   */
  dispatchScopedValue(value: DataValue, updateData = true): void {
    const publication = this.publishValue(value, true, updateData);

    if (this.dataRegistry.isCurrent(publication.group, publication.frame)) {
      this.set(value, false);
    }
  }

  /** @private */
  applyValue(value: DataValue): void {
    if (this.hasVirtualBindings) {
      this.__virtualValue = value;
      this.__hasVirtualValue = true;
      this.__applyVirtualBindings(value);
      return;
    }

    writeControlValue(this.controlContext, value);
  }

  /** @private */
  /** @private */
  __applyVirtualBindings(value: DataValue): void {
    for (const binding of this.virtualBindings) {
      let result: unknown = value;

      if (binding.expression) {
        try {
          result = getCallback(`return ${binding.expression};`)(value, this.target, this.$data);
        } catch (error) {
          console.error('[data] Binding expression failed:', error);
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
            this.target.setAttribute(binding.name, result === true ? '' : bindingText(result));
          }
          break;
        case 'class':
          this.target.classList.toggle(binding.name, Boolean(result));
          break;
        case 'style':
          this.target.style.setProperty(
            binding.name,
            result === false || result === null || result === undefined ? '' : bindingText(result),
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
   * Toggle bound template content. Queued runners guard against stale state.
   * @private
   */
  __applyIfBinding(isPresent: boolean): void {
    const { target } = this;

    if (!(target instanceof HTMLTemplateElement)) {
      this.$warn(
        'data-bind.invalid-if-target',
        'The data-bind:if binding can only be used on a <template> element. Use data-bind:attr.hidden to show or hide an element in place.',
      );
      return;
    }

    if (isPresent === this.__ifPresent) {
      return;
    }

    this.__ifPresent = isPresent;

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

    // Intentionally not awaited: an unclaimed update applies before
    // `domUpdate()` returns its promise, while a runner may defer the change.
    void domUpdate(this.$el, apply, { isPresent });
  }

  /** @private */
  /** @private */
  __validateMutation(method: string): boolean {
    if (this.supportsMutations) {
      return true;
    }

    this.$warn(
      'data-bind.unsupported-mutation',
      `The ${method}() method can not be used with this component.`,
    );
    return false;
  }

  toggle(onValue: DataValue = true, offValue: DataValue = false): void {
    if (!this.__validateMutation('toggle')) {
      return;
    }

    const isRadio = isInput(this.target) && this.target.type === 'radio';
    const hasCustomCheckboxValues =
      isCheckbox(this.target) && (typeof onValue !== 'boolean' || typeof offValue !== 'boolean');

    if (isRadio || hasCustomCheckboxValues) {
      this.$warn(
        'data-bind.unrepresentable-toggle',
        'The toggle() values can not be represented by this input.',
      );
      return;
    }

    this.set(valuesEqual(this.value, onValue) ? offValue : onValue);
  }

  increment(step = 1): void {
    if (!this.__validateMutation('increment')) {
      return;
    }

    if (isInput(this.target) && this.target.type === 'date') {
      this.$warn(
        'data-bind.unsupported-mutation',
        'The increment() method can not be used with date inputs.',
      );
      return;
    }

    const value = Number(this.value);
    this.set((Number.isNaN(value) ? 0 : value) + step);
  }

  cycle(values: readonly DataValue[]): void {
    if (!this.__validateMutation('cycle') || values.length === 0) {
      return;
    }

    const index = values.findIndex((value) => valuesEqual(value, this.value));
    this.set(values[(index + 1) % values.length]);
  }

  /**
   * Join the resolved group and start listening.
   * @private
   */
  __connect(): void {
    this.__disconnect();
    const registry = this.dataRegistry;
    const { group } = this;
    const leave = registry.join(group, this);
    const stop = registry.subscribe(group, (update) => this.__onUpdate(update));
    this.__leaveGroup = () => {
      stop();
      leave();
    };
  }

  /** @private */
  /** @private */
  __disconnect(): void {
    this.__leaveGroup?.();
    this.__leaveGroup = undefined;
  }

  /** @private */
  /** @private */
  __onUpdate(update: DataUpdate): void {
    // Disconnection is processed by the registry on a background task, so an
    // element can be out of the document while still subscribed for one turn.
    if (!this.$el.isConnected) {
      this.__disconnect();
      return;
    }

    if (
      update.source !== this &&
      (!update.key || !this.dataKey || update.key === this.dataKey) &&
      (update.force || this.hasVirtualBindings || this.value !== update.value)
    ) {
      this.set(update.value, false);
    }
  }

  /** @private */
  /** @private */
  __propagateOnMount(): void {
    if (!this.$options.immediate) {
      return;
    }

    const registry = this.dataRegistry;

    if (registry.scoped && this.dataKey) {
      if (this.isDataSource) {
        registry.hydrate(this.group, this);
        return;
      }

      // A subscriber mounted after hydration — content inserted by
      // `data-bind:if`, a fetched fragment — syncs from the current scoped
      // value. On first load the value is not collected yet and arrives
      // through the post-hydration dispatch instead.
      const data = this.$data;
      if (this.dataKey in data) {
        this.set(data[this.dataKey], false);
      }
      return;
    }

    defaultScheduler.background(() => {
      if (this.$isMounted) {
        this.set(this.get());
      }
    });
  }

  /** Follow the nearest registry; create the required root registry as fallback. */
  mounted(): () => void {
    // Before the registry: `dataKey`, `prop` and `get()` all branch on whether
    // this element has virtual bindings, and `__connect()` reads them.
    const stopWatchingNamespace = watchAttributeNamespace(
      this.$el,
      BIND_NAMESPACE,
      ({ qualifier, value, attribute }) => {
        const binding = this.__parseQualifier(qualifier, value);
        if (!binding) {
          return undefined;
        }
        this.__virtualBindings.set(attribute, binding);
        // A rewritten declaration applies the value already in force. Nothing
        // is in force during the initial scan, so the mount pays nothing.
        if (this.__hasVirtualValue) {
          this.__applyVirtualBindings(this.__virtualValue);
        }
        return () => this.__virtualBindings.delete(attribute);
      },
      { qualifiers: BIND_QUALIFIERS, component: this.$config.name },
    );

    const unsubscribe = subscribeContext(this.$el, DataRegistryContext, (registry) => {
      this.__registry = registry;
      this.__connect();
      this.__propagateOnMount();

      return () => {
        this.__disconnect();
        if (registry.scoped && this.dataKey) {
          registry.deleteValue(this.group, this.dataKey, this);
        }
        this.__registry = undefined;
      };
    });

    if (!this.__registry) {
      resolveDataRegistry(this.$el);
    }
    return () => {
      unsubscribe();
      stopWatchingNamespace();
    };
  }
}
