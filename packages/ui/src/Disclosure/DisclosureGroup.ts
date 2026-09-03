import { Base } from '@studiometa/js-toolkit/Base';
import { defaultScheduler } from '@studiometa/js-toolkit/defaultScheduler';
import type { ChildrenCollection, MountedReturn } from '@studiometa/js-toolkit';
import { Disclosure } from './Disclosure.js';

export type DisclosureGroupProps = {
  $options: {
    multiple: boolean;
    collapsible: boolean;
  };
  /**
   * The group's own events, namespaced `disclosure-group-`.
   *
   * `$emit()` bubbles, so a listener bound on the group's element also hears
   * the events its children emit. The two namespaces keep them apart by name
   * on a single listener, which is what `on<Child><Event>` handler resolution
   * needs to work at all.
   */
  $emits: {
    'disclosure-group-open': { item: Disclosure; index: number };
    'disclosure-group-close': { item: Disclosure; index: number };
    'disclosure-group-change': { items: Disclosure[] };
  };
};

/**
 * Coordinate a dynamic collection of independently mounted disclosures.
 *
 * The group owns only group constraints. Each `Disclosure` owns its markup,
 * accessibility state and transitions, and is claimed by its closest group
 * rather than being instantiated by it.
 *
 * **Membership is a live collection, not a registry.** `$watchChildren()` is
 * live and DOM-ordered. What it is *not* is nesting-aware — it collects every
 * mounted `Disclosure` in the subtree, including those belonging to a nested
 * group — so the group claims each one and the disclosure arbitrates, and
 * `items` reads back only the disclosures that ended up with this group.
 *
 * @link https://ui.studiometa.dev/reference/items/Disclosure/
 */
export class DisclosureGroup extends Base<DisclosureGroupProps> {
  static config = {
    name: 'DisclosureGroup',
    components: { Disclosure },
    options: {
      multiple: { type: Boolean, default: true },
      collapsible: { type: Boolean, default: true },
    },
  };

  /**
   * Every mounted disclosure in this subtree, nested groups included. `items`
   * is the filtered view.
   * @private
   */
  __descendants: ChildrenCollection<Disclosure> = this.$watchChildren(Disclosure, {
    added: (item) => item.__claim(this),
    removed: (item) => item.__release(this),
  });

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
   * The disclosures this group owns, in DOM order.
   */
  get items(): Disclosure[] {
    return this.__descendants.items.filter((item) => item.group === this);
  }

  /**
   * Currently open disclosures in DOM order.
   */
  get openItems(): Disclosure[] {
    return this.items.filter((item) => item.isOpen);
  }

  /**
   * Claim the disclosures that were already mounted when this group mounted,
   * and hand them back when it unmounts.
   *
   * The collection is built during construction and outlives a mount cycle, so
   * a group behind `data-mount="media:…"` re-claims its subtree on every
   * remount and releases it on every unmount.
   */
  mounted(): MountedReturn {
    for (const item of this.__descendants) {
      item.__claim(this);
    }
    this.__scheduleReconcile();

    return () => {
      for (const item of this.__descendants) {
        item.__release(this);
      }
    };
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
   * @private
   */
  __onItemStateChange(item: Disclosure, open: boolean): void {
    this.$emit(open ? 'disclosure-group-open' : 'disclosure-group-close', {
      item,
      index: item.index,
    });
    this.$emit('disclosure-group-change', { items: this.openItems });
    this.__syncLockedState();
  }

  /**
   * Normalize initial state once the current turn's mounts have all landed.
   *
   * The background lane is the lane the framework drains its own deferred
   * mount work on, so "after everything mounted" is a guarantee rather than a
   * hope about microtask ordering.
   * @internal
   * @private
   */
  __scheduleReconcile(): void {
    if (this.__reconcileScheduled) {
      return;
    }

    this.__reconcileScheduled = true;
    void defaultScheduler.background(() => {
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
  __reconcile(): void {
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
  __syncLockedState(): void {
    for (const item of this.items) {
      item.__syncDisabledState(this.__isItemLocked(item));
    }
  }

  /**
   * Whether closing this item would violate the group constraint.
   * @internal
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
    return item && item.group === this ? item : undefined;
  }
}
