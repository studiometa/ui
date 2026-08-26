import { Base, type MountedReturn, type OptionChange } from '@studiometa/js-toolkit';
import { Transition } from '../Transition/Transition.js';
import { ViewTransition } from '../ViewTransition/ViewTransition.js';
import type { Transitionable } from '../decorators/withTransition.js';
import type { DisclosureGroup } from './DisclosureGroup.js';

export type DisclosureProps = {
  $refs: {
    trigger: HTMLButtonElement;
    panel: HTMLElement;
  };
  $options: {
    open: boolean;
    disabled: boolean;
  };
  /**
   * Every event carries its emitter as the event target, so none of them needs
   * a payload. v3 passed the instance as the detail; a delegated
   * `onDisclosureOpen({ target })` handler now receives the same thing typed.
   */
  $emits: {
    open: void;
    close: void;
    'after-open': void;
    'after-close': void;
  };
};

/**
 * An independently mountable disclosure controlled by a native button.
 *
 * A Disclosure works on its own and is adopted by the closest
 * `DisclosureGroup` when one exists. The group is therefore optional and does
 * not own the child's construction or lifecycle.
 *
 * **How the group is found changed completely in v4.** v3 asked
 * `$closest('DisclosureGroup:mounted')` and, because nothing announced a
 * mount, backed it with a two-way document `CustomEvent` handshake
 * (`disclosure:connected` / `disclosure-group:connected`) plus a document-wide
 * `MutationObserver` re-running the lookup after any DOM change. All of it is
 * gone: the group holds a live `$watchChildren()` collection and claims the
 * disclosures below it, `__claim()` refuses a claim from a group that is
 * further away than the current one, and `__release()` falls back to the
 * nearest *mounted* group when the current one unmounts. Nesting, late
 * mounting in either order, DOM moves and group teardown all fall out of that,
 * with no listener on `document` and no observer.
 *
 * @link https://ui.studiometa.dev/reference/items/Disclosure/
 */
export class Disclosure extends Base<DisclosureProps> {
  static config = {
    name: 'Disclosure',
    components: { Transition, ViewTransition },
    refs: ['trigger', 'panel'],
    options: {
      open: Boolean,
      disabled: Boolean,
    },
  };

  /**
   * The closest group that claimed this disclosure.
   * @private
   */
  __group?: DisclosureGroup;

  /**
   * Monotonically increasing operation identifier used to contain stale
   * transition completions when an item is toggled rapidly.
   * @private
   */
  __operation = 0;

  /**
   * Serialize transition calls so an opposing transition never interrupts a
   * still-pending transition promise.
   * @private
   */
  __transitionQueue: Promise<void> = Promise.resolve();

  /**
   * Preserve an authored ARIA-disabled state independently from the temporary
   * lock imposed by a non-collapsible group.
   * @private
   */
  __authoredAriaDisabled = false;

  /**
   * Current open state.
   *
   * A field, not `$options.open`: v4's `$options` is a read-only view over the
   * attributes, so the option is the *initial* state and this is the state.
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
    return this.group?.items.indexOf(this) ?? -1;
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
   *
   * The filter names `this.$config.name` rather than the literal `'Disclosure'`
   * so a renamed subclass still recognises its own transitions.
   */
  get transitions(): Transitionable[] {
    const transitions = this.$query<Transition>('Transition');
    const viewTransitions = this.$query<ViewTransition>('ViewTransition');
    return [...transitions, ...viewTransitions].filter(
      (transition) => transition.$closest(this.$config.name) === (this as Base),
    );
  }

  /**
   * Initialize accessibility state and the initial open state.
   *
   * Nothing here looks for a group: the group finds this instance, through the
   * mount announcement its own `$watchChildren()` collection listens for.
   */
  mounted(): MountedReturn {
    this.__initializeAccessibility();
    this.__setInitialState(this.$options.open);

    return () => {
      this.__operation += 1;
      this.$refs.panel.hidden = !this.isOpen;
      this.$refs.panel.inert = false;
      this.__group = undefined;
    };
  }

  /**
   * Re-apply the trigger state when the option changes, whether it was written
   * by `enable()`/`disable()` or by the markup.
   *
   * This is v3's `updated()`, narrowed to the one option that had a reason to
   * be re-read. The initial run is skipped on purpose: option effects run
   * **before** `mounted()`, so syncing here would clear an authored
   * `aria-disabled` before `__initializeAccessibility()` had a chance to
   * record it.
   */
  optionDisabledChanged({ initial }: OptionChange<boolean>): void {
    if (initial) {
      return;
    }
    this.__syncDisabledState();
  }

  /**
   * Toggle when the native trigger is clicked.
   */
  onTriggerClick(): Promise<void> | undefined {
    if (this.disabled || this.$refs.trigger.getAttribute('aria-disabled') === 'true') {
      return undefined;
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

    return this.group ? this.group.open(this) : this.__setOpen(true);
  }

  /**
   * Close this disclosure.
   */
  close(): Promise<void> {
    if (this.disabled) {
      return Promise.resolve();
    }

    return this.group ? this.group.close(this) : this.__setOpen(false);
  }

  /**
   * Toggle this disclosure.
   */
  toggle(): Promise<void> {
    return this.isOpen ? this.close() : this.open();
  }

  /**
   * Enable user interaction.
   *
   * v3 assigned `this.$options.disabled = false`. v4's `$options` is a
   * read-only view over the attributes, and this pair is the one genuine
   * reconfiguration in the whole of `@studiometa/ui`, so it writes the
   * attribute the option reads — the same statement the markup makes. The
   * option getter re-reads the DOM on every access, so the new value is
   * visible on the next line rather than on the next mutation record.
   *
   * The presence-only spelling is deliberate: a boolean option is true when
   * its attribute is there. A responsive `data-option-disabled:s` would still
   * outrank it at that breakpoint, which is a limit of writing an option back
   * rather than of this pair.
   */
  enable(): void {
    this.$el.removeAttribute('data-option-disabled');
    this.__syncDisabledState();
  }

  /**
   * Disable user interaction.
   */
  disable(): void {
    this.$el.setAttribute('data-option-disabled', '');
    this.__syncDisabledState();
  }

  /**
   * Accept a group's claim, unless the current group is nearer.
   *
   * Both groups above a nested disclosure watch it, and they claim in mount
   * order, which is not the nesting order. The test is containment: a claim is
   * accepted when the claiming group sits inside the current one.
   * @internal
   * @private
   */
  __claim(group: DisclosureGroup): void {
    if (this.__group === group) {
      return;
    }

    if (this.__group && !this.__group.$el.contains(group.$el)) {
      return;
    }

    const previous = this.__group;
    this.__group = group;
    previous?.__scheduleReconcile();
    group.__scheduleReconcile();
    this.__syncDisabledState();
  }

  /**
   * Leave a group that stopped watching this disclosure, falling back to the
   * nearest group still mounted above it.
   * @internal
   * @private
   */
  __release(group: DisclosureGroup): void {
    group.__scheduleReconcile();
    if (this.__group !== group) {
      return;
    }

    // The releasing group has already cleared `$isMounted`, so `$closest()`
    // skips it and answers with the next mounted group above, which is v3's
    // `$closest('DisclosureGroup:mounted')` rule with none of its plumbing.
    this.__group = this.$closest<DisclosureGroup>('DisclosureGroup') ?? undefined;
    this.__group?.__scheduleReconcile();
    this.__syncDisabledState();
  }

  /**
   * Apply an initial state without transitions or lifecycle events.
   * @internal
   * @private
   */
  __setInitialState(open: boolean): void {
    this.isOpen = open;
    this.$refs.trigger.setAttribute('aria-expanded', String(open));
    this.$refs.panel.hidden = !open;
    this.$refs.panel.inert = false;
  }

  /**
   * Set open state, optionally bypassing the disabled guard for group invariant
   * enforcement.
   * @internal
   * @private
   */
  __setOpen(open: boolean, force = false): Promise<void> {
    if (this.isOpen === open || (this.disabled && !force)) {
      return Promise.resolve();
    }

    const operation = ++this.__operation;

    if (open) {
      this.isOpen = true;
      this.$refs.panel.hidden = false;
      this.$refs.panel.inert = false;
      this.$refs.trigger.setAttribute('aria-expanded', 'true');
      this.$emit('open');
      this.group?.__onItemStateChange(this, true);
    } else {
      if (this.$refs.panel.contains(document.activeElement)) {
        this.$refs.trigger.focus();
      }

      this.isOpen = false;
      this.$refs.trigger.setAttribute('aria-expanded', 'false');
      this.$refs.panel.inert = true;
      this.$emit('close');
      this.group?.__onItemStateChange(this, false);
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
          this.$error(
            'disclosure.transition-failed',
            'A child transition rejected while the disclosure was changing state.',
            result.reason,
          );
        }
      }

      if (operation !== this.__operation || this.isOpen !== open) {
        return;
      }

      if (!open) {
        this.$refs.panel.hidden = true;
        this.$refs.panel.inert = false;
      }
      this.$emit(open ? 'after-open' : 'after-close');
    };

    const completion = this.__transitionQueue.then(run, run);
    this.__transitionQueue = completion;
    return completion;
  }

  /**
   * Synchronize the trigger's actual and group-imposed disabled states.
   * @internal
   * @private
   */
  __syncDisabledState(groupLocked = this.group?.__isItemLocked(this)): void {
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
  __initializeAccessibility(): void {
    const { trigger, panel } = this.$refs;

    if (!(trigger instanceof HTMLButtonElement)) {
      this.$warn(
        'disclosure.trigger-not-a-button',
        'The `trigger` ref should be a native <button> element.',
      );
    }

    this.__authoredAriaDisabled = trigger.getAttribute('aria-disabled') === 'true';
    trigger.id ||= `${this.$id}-trigger`;
    panel.id ||= `${this.$id}-panel`;
    trigger.setAttribute('aria-controls', panel.id);
    panel.setAttribute('aria-labelledby', trigger.id);
    this.__syncDisabledState();
  }
}
