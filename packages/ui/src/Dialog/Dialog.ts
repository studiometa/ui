import { Base } from '@studiometa/js-toolkit/Base';
import { emitExtendable } from '@studiometa/js-toolkit/emitExtendable';
import { withKey } from '@studiometa/js-toolkit/withKey';
import type { ChildrenCollection, ExtendableDetail, KeyProps } from '@studiometa/js-toolkit';
import { Transition, type Transitionable } from '../Transition/Transition.js';
import { ViewTransition } from '../ViewTransition/ViewTransition.js';
import { saveActiveElement } from '@studiometa/js-toolkit/utils/saveActiveElement';
import { trapFocus } from '@studiometa/js-toolkit/utils/trapFocus';
import { untrapFocus } from '@studiometa/js-toolkit/utils/untrapFocus';
import { lockScroll } from '@studiometa/js-toolkit/utils/lockScroll';

export interface DialogProps {
  $el: HTMLDialogElement;
  $options: {
    /**
     * Open as a modal (`showModal()`) or not (`show()`). A modal dialog gets
     * a native focus trap, background `inert` and focus restore for free.
     */
    modal: boolean;
    /** Trap the focus by hand — only meaningful on the non-modal path. */
    trapFocus: boolean;
    /** Lock the document scroll while open. */
    scrollLock: boolean;
  };
  /**
   * Both lifecycle events are **extendable**: they bubble, and their `detail`
   * carries the `waitUntil()` of core's {@link emitExtendable}. They are
   * dispatched by that helper rather than by `$emit()`, so they are declared
   * here for their payload rather than to widen what `$emit()` accepts.
   */
  $emits: { open: ExtendableDetail; close: ExtendableDetail };
}

/**
 * Headless native dialog with optional modality, focus trapping, scroll lock,
 * and child transitions.
 *
 * ## The two things that hold the dialog open
 *
 * 1. **Declared children.** Every `Transition` and `ViewTransition` inside the
 *    dialog gets `enter()` on open and `leave()` on close.
 * 2. **The extendable `open`/`close` events.** Any listener can register work
 *    with `event.detail.waitUntil()`, which is how a component that is not a
 *    declared child — or plain JavaScript — joins the choreography.
 *
 * The two never overlap. The events are dispatched on the dialog element and
 * **bubble upwards**, so a declared child never receives them and cannot
 * register itself twice. Both mechanisms start in the same tick and are
 * awaited by a single `Promise.all`, so they run concurrently rather than in
 * sequence, and neither can outrun the other.
 */
export class Dialog extends withKey(Base)<DialogProps> {
  static config = {
    name: 'Dialog',
    components: { Transition, ViewTransition },
    options: {
      modal: { type: Boolean, default: true },
      trapFocus: { type: Boolean, default: true },
      scrollLock: { type: Boolean, default: true },
    },
  };

  /**
   * Releases this dialog's hold on the page scroll.
   *
   * A field rather than a style write, because the page scroll is shared: a
   * dialog opened from inside a drawer must not put the scroll back when it
   * closes while the drawer is still open. It is released on close and again
   * on unmount — the release is idempotent, and a dialog unmounted while open
   * used to leak its lock for the life of the page.
   */
  __releaseScroll: (() => void) | null = null;

  /**
   * The in-flight `close()` run, so concurrent calls await the same
   * choreography instead of racing it.
   *
   * The window is wide now that an extension can hold the close open for as
   * long as it likes: without this, a second `close()` — the Escape key while
   * a button click is still animating out — would emit `close` again, run
   * every `leave()` again and release the scroll twice.
   * @private
   */
  __closing: Promise<void> | null = null;

  transitionChildren: ChildrenCollection<Transition> =
    this.$watchChildren<Transition>('Transition');

  viewTransitionChildren: ChildrenCollection<ViewTransition> =
    this.$watchChildren<ViewTransition>('ViewTransition');

  get transitions(): Transitionable[] {
    return [...this.transitionChildren.items, ...this.viewTransitionChildren.items];
  }

  get isOpen(): boolean {
    return this.$el.open;
  }

  /** Trap the tabulation by hand; a modal dialog gets the trap natively. */
  keyed({ event, isDown }: KeyProps): void {
    if (!event || !isDown || this.$options.modal || !this.$options.trapFocus || !this.$el.open) {
      return;
    }
    trapFocus(this.$el, event);
  }

  /** Route native cancellation through `close()` so cleanup and transitions run. */
  onCancel(event: Event): void {
    event.preventDefault();
    void this.close();
  }

  async open(): Promise<void> {
    if (this.$el.open) {
      return;
    }

    if (this.$options.modal) {
      this.$el.showModal();
    } else {
      if (this.$options.trapFocus) {
        saveActiveElement();
      }
      this.$el.show();
    }

    if (this.$options.scrollLock) {
      this.__releaseScroll = lockScroll();
    }

    // The native dialog is already painted: only this promise waits. The
    // helper dispatches synchronously, so both mechanisms start in this tick.
    await Promise.all([
      emitExtendable(this.$el, 'open'),
      ...this.transitions.map((transition) => transition.enter()),
    ]);
  }

  async close(): Promise<void> {
    if (!this.$el.open) {
      return;
    }

    this.__closing ??= this.__close().finally(() => {
      this.__closing = null;
    });

    return this.__closing;
  }

  /**
   * Run the closing choreography: announce the extendable `close` event and
   * run every transition child's `leave()`, await both — the dialog stays
   * painted while they play — then hide the native dialog and clean up.
   * @private
   */
  async __close(): Promise<void> {
    await Promise.all([
      emitExtendable(this.$el, 'close'),
      ...this.transitions.map((transition) => transition.leave()),
    ]);
    this.$el.close();

    if (!this.$options.modal && this.$options.trapFocus) {
      untrapFocus();
    }

    this.__releaseScroll?.();
    this.__releaseScroll = null;
  }

  /** A dialog unmounted while open still owes the page its scroll. */
  unmounted(): void {
    this.__releaseScroll?.();
    this.__releaseScroll = null;
  }

  toggle(): Promise<void> {
    return this.$el.open ? this.close() : this.open();
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Dialog`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Dialog;
