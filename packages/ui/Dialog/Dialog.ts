import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig, KeyServiceProps } from '@studiometa/js-toolkit';
import { trapFocus, untrapFocus, saveActiveElement } from '@studiometa/js-toolkit/utils';
import { Transition } from '../Transition/index.js';
import { ViewTransition } from '../ViewTransition/index.js';

export interface DialogProps extends BaseProps {
  $el: HTMLDialogElement;
  $children: {
    Transition: Transition[];
    ViewTransition: ViewTransition[];
  };
  $options: {
    /**
     * Whether to open the dialog as a modal (`showModal()`) or not (`show()`).
     * A modal dialog gets a native focus trap, background `inert` and focus
     * restore for free; a non-modal one keeps the rest of the page interactive.
     */
    modal: boolean;
    /**
     * Trap the focus inside the dialog. Only meaningful on the non-modal
     * (`show()`) path — `showModal()` already traps focus natively.
     */
    trapFocus: boolean;
    /**
     * Lock the scroll on the document element while the dialog is open.
     */
    scrollLock: boolean;
  };
}

/**
 * Dialog class.
 *
 * A headless wrapper around the native `<dialog>` element. It owns only what
 * the platform does not give for free — modality, scroll-lock and an optional
 * focus-trap for the non-modal path — and orchestrates transitions by fanning
 * `enter()`/`leave()` out to every `Transition`/`ViewTransition` child it
 * contains (the backdrop and the box are just two of them).
 *
 * Triggers are delegated to the `Action` component in the authored HTML, so the
 * class needs no refs and no manual `addEventListener`; the optional focus-trap
 * uses the `keyed()` KeyService hook.
 *
 * @link https://ui.studiometa.dev/components/Dialog/
 */
export class Dialog<T extends BaseProps = BaseProps> extends Base<T & DialogProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Dialog',
    components: { Transition, ViewTransition },
    emits: ['open', 'close'],
    options: {
      modal: { type: Boolean, default: true },
      trapFocus: { type: Boolean, default: true },
      scrollLock: { type: Boolean, default: true },
    },
  };

  /**
   * Get the native `<dialog>` element.
   */
  get dialog(): HTMLDialogElement {
    return this.$el;
  }

  /**
   * Get every transition child to orchestrate, `Transition` and
   * `ViewTransition` alike. With none, open/close are instant.
   */
  get transitions(): Array<Transition | ViewTransition> {
    const { Transition: transitions = [], ViewTransition: viewTransitions = [] } = this.$children;
    return [...transitions, ...viewTransitions] as Array<Transition | ViewTransition>;
  }

  /**
   * Open the dialog.
   */
  async open(): Promise<void> {
    if (this.dialog.open) {
      return;
    }

    if (this.$options.modal) {
      this.dialog.showModal();
    } else {
      if (this.$options.trapFocus) {
        saveActiveElement();
      }
      this.dialog.show();
    }

    if (this.$options.scrollLock) {
      document.documentElement.style.overflow = 'hidden';
    }

    this.$emit('open');
    await Promise.all(this.transitions.map((transition) => transition.enter()));
  }

  /**
   * Close the dialog.
   */
  async close(): Promise<void> {
    if (!this.dialog.open) {
      return;
    }

    this.$emit('close');
    // The leave transitions are awaited **before** the native hide so the
    // dialog is still painted while its children animate out.
    await Promise.all(this.transitions.map((transition) => transition.leave()));
    this.dialog.close();

    if (!this.$options.modal && this.$options.trapFocus) {
      untrapFocus();
    }

    if (this.$options.scrollLock) {
      document.documentElement.style.overflow = '';
    }
  }

  /**
   * Toggle the dialog open or closed.
   */
  toggle(): Promise<void> {
    return this.dialog.open ? this.close() : this.open();
  }

  /**
   * Trap the tabulation inside the dialog on the non-modal path only —
   * `showModal()` traps the focus natively.
   */
  keyed({ event, isDown }: KeyServiceProps) {
    if (this.$options.modal || !this.$options.trapFocus || !this.dialog.open) {
      return;
    }

    if (isDown) {
      trapFocus(this.dialog, event);
    }
  }
}
