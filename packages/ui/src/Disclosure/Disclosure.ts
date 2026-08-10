import { Base } from '@studiometa/js-toolkit/Base';
import { useMutation } from '@studiometa/js-toolkit/useMutation';
import type { BaseConfig, BaseProps, MutationServiceInterface } from '@studiometa/js-toolkit';
import { Transition } from '../Transition/index.js';
import { ViewTransition } from '../ViewTransition/index.js';
import type { DisclosureGroup } from './DisclosureGroup.js';

export const DISCLOSURE_CONNECTED = 'disclosure:connected';
export const DISCLOSURE_GROUP_CONNECTED = 'disclosure-group:connected';

export interface DisclosureProps extends BaseProps {
  $refs: {
    trigger: HTMLButtonElement;
    panel: HTMLElement;
  };
  $options: {
    open: boolean;
    disabled: boolean;
  };
}

/**
 * An independently mountable disclosure controlled by a native button.
 *
 * A Disclosure works on its own and advertises itself to the closest
 * `DisclosureGroup` when one exists. The group is therefore optional and does
 * not own the child's registration or lifecycle.
 *
 * @link https://ui.studiometa.dev/reference/items/Disclosure/
 */
export class Disclosure<T extends BaseProps = BaseProps> extends Base<T & DisclosureProps> {
  static config: BaseConfig = {
    name: 'Disclosure',
    components: { Transition, ViewTransition },
    emits: ['open', 'close', 'after-open', 'after-close'],
    refs: ['trigger', 'panel'],
    options: {
      open: Boolean,
      disabled: Boolean,
    },
  };

  /**
   * The closest group this disclosure registered with.
   * @private
   */
  __group?: DisclosureGroup;

  /**
   * Remove the standing group connection listener.
   * @private
   */
  __offGroupConnected?: () => void;

  /**
   * Monotonically increasing operation identifier used to contain stale
   * transition completions when an item is toggled rapidly.
   * @private
   */
  __operation = 0;

  /**
   * Serialize transition calls so an opposing transition never interrupts a
   * still-pending toolkit transition promise.
   * @private
   */
  __transitionQueue: Promise<void> = Promise.resolve();

  /**
   * Shared document mutation service used to reconnect after DOM reparenting.
   * @private
   */
  __mutationService?: MutationServiceInterface;

  /**
   * Per-instance key for the shared mutation service.
   * @private
   */
  __mutationKey = Symbol('Disclosure');

  /**
   * Preserve an authored ARIA-disabled state independently from the temporary
   * lock imposed by a non-collapsible group.
   * @private
   */
  __authoredAriaDisabled = false;

  /**
   * Current open state.
   */
  isOpen = false;

  /**
   * The group this disclosure belongs to, if any.
   */
  get group(): DisclosureGroup | undefined {
    return this.__group;
  }

  /**
   * This disclosure's current index in its group, in DOM order.
   */
  get index(): number {
    return this.group?.items.indexOf(this as unknown as Disclosure) ?? -1;
  }

  /**
   * Whether user interaction with this disclosure is disabled.
   */
  get disabled(): boolean {
    return this.$options.disabled;
  }

  /**
   * Transition children owned by this disclosure, excluding transitions from
   * nested disclosures.
   */
  get transitions(): Array<Transition | ViewTransition> {
    const transitions = this.$query<Transition>('Transition');
    const viewTransitions = this.$query<ViewTransition>('ViewTransition');
    return [...transitions, ...viewTransitions].filter(
      (transition) => transition.$closest<Disclosure>('Disclosure') === this,
    );
  }

  /**
   * Initialize accessibility state and advertise this disclosure.
   */
  mounted() {
    this.__initializeAccessibility();
    this.__setInitialState(this.$options.open);

    const onGroupConnected = () => this.__connect();
    document.addEventListener(DISCLOSURE_GROUP_CONNECTED, onGroupConnected);
    this.__offGroupConnected = () =>
      document.removeEventListener(DISCLOSURE_GROUP_CONNECTED, onGroupConnected);

    this.__mutationService = useMutation(document, { childList: true, subtree: true });
    this.__mutationService.add(this.__mutationKey, () => this.__connect());

    this.__connect();
    this.__advertise();
  }

  /**
   * Re-resolve the closest group after a DOM update.
   */
  updated() {
    this.__connect();
    this.__syncDisabledState();
  }

  /**
   * Unregister from the cached group and cancel pending completions.
   */
  destroyed() {
    this.__operation += 1;
    this.__offGroupConnected?.();
    this.__offGroupConnected = undefined;
    this.__mutationService?.remove(this.__mutationKey);
    this.__mutationService = undefined;
    this.$refs.panel.hidden = !this.isOpen;
    this.$refs.panel.inert = false;
    this.__group?.unregister(this as unknown as Disclosure);
    this.__group = undefined;
  }

  /**
   * Toggle when the native trigger is clicked.
   */
  onTriggerClick() {
    if (this.disabled || this.$refs.trigger.getAttribute('aria-disabled') === 'true') {
      return;
    }

    return this.toggle();
  }

  /**
   * Open this disclosure.
   */
  open(): Promise<void> {
    if (this.disabled) {
      return Promise.resolve();
    }

    return this.group ? this.group.open(this as unknown as Disclosure) : this.__setOpen(true);
  }

  /**
   * Close this disclosure.
   */
  close(): Promise<void> {
    if (this.disabled) {
      return Promise.resolve();
    }

    return this.group ? this.group.close(this as unknown as Disclosure) : this.__setOpen(false);
  }

  /**
   * Toggle this disclosure.
   */
  toggle(): Promise<void> {
    return this.isOpen ? this.close() : this.open();
  }

  /**
   * Enable user interaction.
   */
  enable() {
    this.$options.disabled = false;
    this.__syncDisabledState();
  }

  /**
   * Disable user interaction.
   */
  disable() {
    this.$options.disabled = true;
    this.__syncDisabledState();
  }

  /**
   * Register with the closest group, migrating when a nearer nested group is
   * mounted after this disclosure.
   * @internal
   */
  __connect(
    group: DisclosureGroup | undefined = this.$closest<DisclosureGroup>('DisclosureGroup:mounted'),
  ) {
    if (group === this.__group) {
      group?.register(this as unknown as Disclosure);
      return;
    }

    this.__group?.unregister(this as unknown as Disclosure);
    this.__group = group;
    this.__group?.register(this as unknown as Disclosure);
  }

  /**
   * Disconnect from a group that is being destroyed.
   * @internal
   */
  __disconnect(group: DisclosureGroup) {
    if (this.__group === group) {
      this.__group = undefined;
    }
  }

  /**
   * Apply an initial state without transitions or lifecycle events.
   * @internal
   */
  __setInitialState(open: boolean) {
    this.isOpen = open;
    this.$options.open = open;
    this.$refs.trigger.setAttribute('aria-expanded', String(open));
    this.$refs.panel.hidden = !open;
    this.$refs.panel.inert = false;
  }

  /**
   * Set open state, optionally bypassing the disabled guard for group invariant
   * enforcement.
   * @internal
   */
  __setOpen(open: boolean, force = false): Promise<void> {
    if (this.isOpen === open || (this.disabled && !force)) {
      return Promise.resolve();
    }

    const operation = ++this.__operation;

    if (open) {
      this.isOpen = true;
      this.$options.open = true;
      this.$refs.panel.hidden = false;
      this.$refs.panel.inert = false;
      this.$refs.trigger.setAttribute('aria-expanded', 'true');
      this.$emit('open', this);
      this.group?.__onItemStateChange(this as unknown as Disclosure, true);
    } else {
      if (this.$refs.panel.contains(document.activeElement)) {
        this.$refs.trigger.focus();
      }

      this.isOpen = false;
      this.$options.open = false;
      this.$refs.trigger.setAttribute('aria-expanded', 'false');
      this.$refs.panel.inert = true;
      this.$emit('close', this);
      this.group?.__onItemStateChange(this as unknown as Disclosure, false);
    }

    const run = async () => {
      if (operation !== this.__operation) {
        return;
      }

      const results = await Promise.allSettled(
        this.transitions.map((transition) => (open ? transition.enter() : transition.leave())),
      );
      for (const result of results) {
        if (result.status === 'rejected') {
          this.$warn(result.reason);
        }
      }

      if (operation !== this.__operation || this.isOpen !== open) {
        return;
      }

      if (!open) {
        this.$refs.panel.hidden = true;
        this.$refs.panel.inert = false;
      }
      this.$emit(open ? 'after-open' : 'after-close', this);
    };

    const completion = this.__transitionQueue.then(run, run);
    this.__transitionQueue = completion;
    return completion;
  }

  /**
   * Synchronize the trigger's actual and group-imposed disabled states.
   * @internal
   */
  __syncDisabledState(groupLocked = this.group?.__isItemLocked(this as unknown as Disclosure)) {
    this.$refs.trigger.disabled = this.disabled;
    if (groupLocked || this.__authoredAriaDisabled) {
      this.$refs.trigger.setAttribute('aria-disabled', 'true');
    } else {
      this.$refs.trigger.removeAttribute('aria-disabled');
    }
  }

  /**
   * Create the ARIA relationship between trigger and panel.
   * @private
   */
  __initializeAccessibility() {
    const { trigger, panel } = this.$refs;

    if (!(trigger instanceof HTMLButtonElement)) {
      this.$warn('The `trigger` ref should be a native <button> element.');
    }

    this.__authoredAriaDisabled = trigger.getAttribute('aria-disabled') === 'true';
    trigger.id ||= `${this.$id}-trigger`;
    panel.id ||= `${this.$id}-panel`;
    trigger.setAttribute('aria-controls', panel.id);
    panel.setAttribute('aria-labelledby', trigger.id);
    this.__syncDisabledState();
  }

  /**
   * Advertise this independently registered child to mounted groups.
   * @private
   */
  __advertise() {
    document.dispatchEvent(
      new CustomEvent(DISCLOSURE_CONNECTED, {
        detail: this,
      }),
    );
  }
}

export default Disclosure;
