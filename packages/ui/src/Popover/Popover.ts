import { Base } from '@studiometa/js-toolkit/Base';
import { emitExtendable } from '@studiometa/js-toolkit/emitExtendable';
import type { ChildrenCollection, ExtendableDetail } from '@studiometa/js-toolkit';
import { Transition, type Transitionable } from '../Transition/Transition.js';
import { ViewTransition } from '../ViewTransition/ViewTransition.js';

export interface PopoverProps {
  $el: HTMLElement;
  /**
   * Both lifecycle events are **extendable**, as on `Dialog`: they bubble, and
   * their `detail` carries the `waitUntil()` of core's {@link emitExtendable}.
   */
  $emits: { open: ExtendableDetail; close: ExtendableDetail };
}

/**
 * Headless wrapper around the native Popover API: the non-modal sibling of
 * `Dialog`.
 *
 * The `[popover]` element gets top-layer stacking and, with `popover="auto"`,
 * <kbd>Esc</kbd> and light-dismiss from the platform. This class only
 * orchestrates the transitions: it fans `enter()` and `leave()` out to every
 * `Transition` and `ViewTransition` child, and announces the extendable `open`
 * and `close` events.
 *
 * It ships no markup, no trigger and no positioning: the HTML wires the
 * triggers with `Action` and places the panel with its own CSS.
 */
export class Popover extends Base<PopoverProps> {
  static config = {
    name: 'Popover',
    components: { Transition, ViewTransition },
  };

  /**
   * The state this component asked the platform for. It is ahead of
   * `:popover-open` while a leave transition plays, which is what lets the
   * `toggle` handler tell a platform close from one of ours.
   * @private
   */
  __isOpen = false;

  /**
   * The in-flight `close()` run, so concurrent calls await the same
   * choreography instead of racing it.
   * @private
   */
  __closing: Promise<void> | null = null;

  /**
   * Incremented by every `open()` and `close()`. A close run hides the
   * popover only when no later call happened during its leave transitions.
   * @private
   */
  __generation = 0;

  transitionChildren: ChildrenCollection<Transition> =
    this.$watchChildren<Transition>('Transition');

  viewTransitionChildren: ChildrenCollection<ViewTransition> =
    this.$watchChildren<ViewTransition>('ViewTransition');

  /** The native `[popover]` element. */
  get popover(): HTMLElement {
    return this.$el;
  }

  /** Every `Transition` and `ViewTransition` child the popover orchestrates. */
  get transitions(): Transitionable[] {
    return [...this.transitionChildren.items, ...this.viewTransitionChildren.items];
  }

  /** Whether the popover is open, or opening. `false` as soon as `close()` starts. */
  get isOpen(): boolean {
    return this.__isOpen;
  }

  /**
   * Keep the state in sync when the platform toggles the popover on its own:
   * light-dismiss or <kbd>Esc</kbd> on a `popover="auto"` element, or a
   * `popovertarget` button. The `toggle` event of our own `showPopover()` and
   * `hidePopover()` calls agrees with `__isOpen` and is ignored.
   *
   * A platform close is instant: the element is already hidden, so the leave
   * transitions cannot play. A platform open runs the enter transitions.
   */
  onToggle(event: ToggleEvent): void {
    if (event.newState === 'closed' && this.__isOpen) {
      this.__isOpen = false;
      void emitExtendable(this.$el, 'close');
    } else if (event.newState === 'open' && !this.__isOpen) {
      this.__isOpen = true;
      void this.__enter();
    }
  }

  /**
   * Open the popover: call `showPopover()`, emit the extendable `open` event
   * and run every transition child's `enter()`. A no-op if already open.
   */
  async open(): Promise<void> {
    if (this.__isOpen) {
      return;
    }

    this.__isOpen = true;
    this.__generation += 1;
    // A no-op when a leave transition still holds the popover painted.
    this.$el.showPopover();
    await this.__enter();
  }

  /**
   * Close the popover: emit the extendable `close` event and run every
   * transition child's `leave()`, then call `hidePopover()`. A second call
   * during the leave transitions shares the same run.
   */
  async close(): Promise<void> {
    if (!this.__isOpen) {
      return this.__closing ?? undefined;
    }

    const closing: Promise<void> = this.__close().finally(() => {
      if (this.__closing === closing) {
        this.__closing = null;
      }
    });
    this.__closing = closing;

    return closing;
  }

  toggle(): Promise<void> {
    return this.__isOpen ? this.close() : this.open();
  }

  /**
   * Announce the extendable `open` event and run every `enter()`. The helper
   * dispatches synchronously, so both start in this tick.
   * @private
   */
  async __enter(): Promise<void> {
    await Promise.all([
      emitExtendable(this.$el, 'open'),
      ...this.transitions.map((transition) => transition.enter()),
    ]);
  }

  /**
   * Run the closing choreography: emit the extendable `close` event and run
   * every `leave()`, await both — the popover stays painted while they play —
   * then hide it. An `open()` or a newer `close()` during the leave
   * transitions takes over, and this run does not hide it.
   * @private
   */
  async __close(): Promise<void> {
    this.__isOpen = false;
    this.__generation += 1;
    const generation = this.__generation;

    await Promise.all([
      emitExtendable(this.$el, 'close'),
      ...this.transitions.map((transition) => transition.leave()),
    ]);

    if (generation === this.__generation) {
      this.$el.hidePopover();
    }
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Popover`) exposes it.
 */
export default Popover;
