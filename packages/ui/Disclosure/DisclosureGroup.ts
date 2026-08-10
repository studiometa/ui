import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { nextTick } from '@studiometa/js-toolkit/utils/nextTick';
import { DISCLOSURE_CONNECTED, DISCLOSURE_GROUP_CONNECTED, type Disclosure } from './Disclosure.js';

export interface DisclosureGroupProps extends BaseProps {
  $options: {
    multiple: boolean;
    collapsible: boolean;
  };
}

/**
 * Coordinate a dynamic collection of independently registered disclosures.
 *
 * The group owns only group constraints. Each `Disclosure` owns its markup,
 * accessibility state and transitions, and advertises itself to its closest
 * group instead of being instantiated by the parent.
 *
 * @link https://ui.studiometa.dev/reference/items/Disclosure/
 */
export class DisclosureGroup<T extends BaseProps = BaseProps> extends Base<
  T & DisclosureGroupProps
> {
  static config: BaseConfig = {
    name: 'DisclosureGroup',
    emits: ['open', 'close', 'change'],
    options: {
      multiple: { type: Boolean, default: true },
      collapsible: { type: Boolean, default: true },
    },
  };

  /**
   * Registered disclosures. Public access goes through `items`, which returns
   * them in current DOM order.
   * @private
   */
  __items = new Set<Disclosure>();

  /**
   * Remove the standing child advertisement listener.
   * @private
   */
  __offDisclosureConnected?: () => void;

  /**
   * Whether an initialization reconciliation is already queued.
   * @private
   */
  __reconcileScheduled = false;

  /**
   * Latest public group mutation. Re-entrant event handlers invalidate the
   * operation that emitted them so the latest intent wins.
   * @private
   */
  __operation = 0;

  /**
   * Registered disclosures in DOM order.
   */
  get items(): Disclosure[] {
    return [...this.__items]
      .filter((item) => item.group === this && this.$el.contains(item.$el))
      .sort((a, b) => {
        const position = a.$el.compareDocumentPosition(b.$el);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
  }

  /**
   * Currently open disclosures in DOM order.
   */
  get openItems(): Disclosure[] {
    return this.items.filter((item) => item.isOpen);
  }

  /**
   * Listen for independently mounted children and announce this group so
   * children which mounted first can retry their closest-parent lookup.
   */
  mounted() {
    const onDisclosureConnected = (event: Event) => {
      const disclosure = (event as CustomEvent<Disclosure>).detail;
      if (disclosure?.$el && this.$el.contains(disclosure.$el)) {
        disclosure.__connect();
      }
    };

    document.addEventListener(DISCLOSURE_CONNECTED, onDisclosureConnected);
    this.__offDisclosureConnected = () =>
      document.removeEventListener(DISCLOSURE_CONNECTED, onDisclosureConnected);

    document.dispatchEvent(
      new CustomEvent(DISCLOSURE_GROUP_CONNECTED, {
        detail: this,
      }),
    );

    this.__scheduleReconcile();
  }

  /**
   * Reconcile options and DOM ordering after an update.
   */
  updated() {
    this.__scheduleReconcile();
  }

  /**
   * Disconnect every child and remove document listeners.
   */
  destroyed() {
    this.__offDisclosureConnected?.();
    this.__offDisclosureConnected = undefined;

    for (const item of this.__items) {
      item.__disconnect(this as unknown as DisclosureGroup);
      item.__connect();
    }
    this.__items.clear();
  }

  /**
   * Register a disclosure. Registration is idempotent.
   */
  register(disclosure: Disclosure) {
    if (
      this.__items.has(disclosure) ||
      disclosure.$closest<DisclosureGroup>('DisclosureGroup:mounted') !== this
    ) {
      return;
    }

    this.__items.add(disclosure);
    this.__scheduleReconcile();
  }

  /**
   * Unregister a disclosure. Registration order never affects public ordering.
   */
  unregister(disclosure: Disclosure) {
    if (this.__items.delete(disclosure)) {
      this.__scheduleReconcile();
    }
  }

  /**
   * Open one disclosure and enforce single-open mode when configured.
   */
  async open(itemOrIndex: Disclosure | number): Promise<void> {
    const item = this.__resolveItem(itemOrIndex);
    if (!item || item.disabled) {
      return;
    }

    const operation = ++this.__operation;
    const completions: Promise<void>[] = [];

    if (!this.$options.multiple) {
      for (const openItem of this.openItems) {
        if (openItem !== item) {
          completions.push(openItem.__setOpen(false, true));
          // Closing emits synchronously. A listener may have issued a newer
          // group mutation; if so, do not let this stale request open its target.
          if (operation !== this.__operation) {
            await Promise.all(completions);
            return;
          }
        }
      }
    }

    // `__setOpen` commits state synchronously before returning its transition
    // promise. Start the opening before awaiting closing animations so another
    // request always observes the target as open.
    completions.push(item.__setOpen(true));
    await Promise.all(completions);
    this.__syncLockedState();
  }

  /**
   * Close one disclosure while respecting non-collapsible single-open mode.
   */
  async close(itemOrIndex: Disclosure | number): Promise<void> {
    const item = this.__resolveItem(itemOrIndex);
    if (!item || item.disabled || this.__isItemLocked(item)) {
      return;
    }

    this.__operation += 1;
    await item.__setOpen(false);
    this.__syncLockedState();
  }

  /**
   * Toggle one disclosure.
   */
  toggle(itemOrIndex: Disclosure | number): Promise<void> {
    const item = this.__resolveItem(itemOrIndex);
    if (!item) {
      return Promise.resolve();
    }

    return item.isOpen ? this.close(item) : this.open(item);
  }

  /**
   * Open all disclosures when multiple-open mode is enabled.
   */
  async openAll(): Promise<void> {
    if (!this.$options.multiple) {
      return;
    }

    this.__operation += 1;
    await Promise.all(
      this.items.filter((item) => !item.disabled).map((item) => item.__setOpen(true)),
    );
    this.__syncLockedState();
  }

  /**
   * Close every disclosure unless the group requires one to remain open.
   */
  async closeAll(): Promise<void> {
    if (!this.$options.multiple && !this.$options.collapsible) {
      return;
    }

    this.__operation += 1;
    await Promise.all(
      this.openItems.filter((item) => !item.disabled).map((item) => item.__setOpen(false)),
    );
    this.__syncLockedState();
  }

  /**
   * Relay item state changes through the group.
   * @internal
   */
  __onItemStateChange(item: Disclosure, open: boolean) {
    this.$emit(open ? 'open' : 'close', item, item.index);
    this.$emit('change', this.openItems);
    this.__syncLockedState();
  }

  /**
   * Normalize initial state after all components from the current mount turn had
   * a chance to advertise themselves.
   * @private
   */
  __scheduleReconcile() {
    if (this.__reconcileScheduled) {
      return;
    }

    this.__reconcileScheduled = true;
    nextTick().then(() => {
      this.__reconcileScheduled = false;
      if (this.$isMounted) {
        this.__reconcile();
      }
    });
  }

  /**
   * Enforce deterministic initial state without playing transitions or emitting
   * lifecycle events.
   * @private
   */
  __reconcile() {
    const items = this.items;

    if (!this.$options.multiple) {
      const [firstOpen, ...extraOpen] = items.filter((item) => item.isOpen);
      for (const item of extraOpen) {
        item.__setInitialState(false);
      }

      if (!firstOpen && !this.$options.collapsible) {
        items.find((item) => !item.disabled)?.__setInitialState(true);
      }
    }

    this.__syncLockedState();
  }

  /**
   * Apply `aria-disabled` to the one trigger which cannot currently collapse.
   * @private
   */
  __syncLockedState() {
    for (const item of this.items) {
      item.__syncDisabledState(this.__isItemLocked(item));
    }
  }

  /**
   * Whether closing this item would violate the group constraint.
   * @private
   */
  __isItemLocked(item: Disclosure): boolean {
    return (
      !this.$options.multiple &&
      !this.$options.collapsible &&
      item.isOpen &&
      this.openItems.length === 1
    );
  }

  /**
   * Resolve a public item-or-index argument and reject foreign items.
   * @private
   */
  __resolveItem(itemOrIndex: Disclosure | number): Disclosure | undefined {
    const item = typeof itemOrIndex === 'number' ? this.items[itemOrIndex] : itemOrIndex;
    return item && item.group === this && this.items.includes(item) ? item : undefined;
  }
}
