import { Base, KeyServiceProps } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { transition, isArray, focusTrap } from '@studiometa/js-toolkit/utils';

const { trap, untrap, saveActiveElement } = focusTrap();

type ModalStates = Partial<Record<'open'|'active'|'closed', string|Partial<CSSStyleDeclaration>>>
// eslint-disable-next-line no-use-before-define
type ModalStylesOption = Partial<Record<keyof ModalProps['$refs'], ModalStates>>

export interface ModalProps extends BaseProps {
  $refs: {
    close: HTMLElement[];
    container: HTMLElement;
    content: HTMLElement;
    modal: HTMLElement;
    open: HTMLElement[];
    overlay: HTMLElement;
  };
  $options: {
    /**
     * A selector where to move the modal to.
     */
    move: string;
    /**
     * A selector for the element to set the focus to when the modal opens.
     */
    autofocus: string;
    /**
     * Lock or allow scroll in the documentElement.
     */
    scrollLock: boolean;
    /**
     * The styles for the different state of the modal.
     */
    styles: ModalStylesOption;
  }
}

/**
 * Modal class.
 */
export class Modal<T extends BaseProps = BaseProps> extends Base<T & ModalProps> {
  /**
   * Config.
   */
  static config:BaseConfig = {
    name: 'Modal',
    refs: ['close[]', 'container', 'content', 'modal', 'open[]', 'overlay'],
    emits: ['open', 'close'],
    options: {
      move: String,
      autofocus: { type: String, default: '[autofocus]' },
      styles: {
        type: Object,
        default: ():ModalStylesOption => ({
          modal: {
            closed: {
              opacity: '0',
              pointerEvents: 'none',
              visibility: 'hidden',
            },
          },
        }),
      },
      scrollLock: {
        type: Boolean,
        default: true,
      },
    },
  };

  /**
   * Wether the modal is open or not.
   */
  isOpen = false;

  /**
   * @private
   */
  __refsBackup:(T & ModalProps)['$refs'];

  /**
   * @private
   */
  __refModalPlaceholder: Comment;

  /**
   * @private
   */
  __refModalParentBackup: HTMLElement;

  /**
   * @private
   */
  __refModalUnbindGetRefFilter:() => void;

  /**
   * Open the modal on click on the `open` ref.
   */
  get onOpenClick() {
    return this.open;
  }

  /**
   * Close the modal on click on the `close` ref.
   */
  get onCloseClick() {
    return this.close;
  }

  /**
   * Close the modal on click on the `overlay` ref.
   *
   * @returns {Function} The component's `close` method.
   */
  get onOverlayClick() {
    return this.close;
  }

  /**
   * Initialize the component's behaviours.
   */
  mounted() {
    this.isOpen = false;
    this.close();

    if (this.$options.move) {
      const target = document.querySelector(this.$options.move) || document.body;

      this.__refsBackup = this.$refs;
      this.__refModalPlaceholder = document.createComment('');
      this.__refModalParentBackup = this.$refs.modal.parentElement || this.$el;
      this.__refModalParentBackup.insertBefore(this.__refModalPlaceholder, this.$refs.modal);

      target.append(this.$refs.modal);
    }
  }

  /**
   * Add the moved refs to `this.$refs` when using the `move` options.
   */
  get $refs() {
    const $refs = super.$refs;

    if (this.$options.move && this.__refsBackup) {
      Object.entries(this.__refsBackup).forEach(([key, ref]) => {
        if (!$refs[key]) {
          // @ts-ignore
          $refs[key] = ref;
        }
      });
    }

    return $refs;
  }

  /**
   * Unbind all events on destroy.
   */
  destroyed() {
    this.close();

    if (this.$options.move && this.__refModalParentBackup) {
      this.__refModalParentBackup.insertBefore(this.$refs.modal, this.__refModalPlaceholder);
      this.__refModalPlaceholder.remove();
      delete this.__refModalPlaceholder;
      delete this.__refModalParentBackup;
    }

    return this;
  }

  /**
   * Close the modal on `ESC` and trap the tabulation.
   */
  keyed({ event, isUp, isDown, ESC }:KeyServiceProps) {
    if (!this.isOpen) {
      return;
    }

    if (isDown) {
      trap(this.$refs.modal, event);
    }

    if (ESC && isUp) {
      this.close();
    }
  }

  /**
   * Open the modal.
   */
  async open() {
    if (this.isOpen) {
      return Promise.resolve();
    }

    this.$refs.modal.setAttribute('aria-hidden', 'false');

    if (this.$options.scrollLock) {
      document.documentElement.style.overflow = 'hidden';
    }

    this.isOpen = true;
    this.$emit('open');

    /** @type {ModalRefs} */
    const refs = this.$refs;

    return Promise.all(
      Object.entries(this.$options.styles).map(
        ([refName, { open, active, closed } = { open: '', active: '', closed: '' }]) =>
          transition(
            refs[refName],
            {
              from: closed,
              active,
              to: open,
            },
            'keep',
          ),
      ),
    ).then(() => {
      if (this.$options.autofocus && this.$refs.modal.querySelector(this.$options.autofocus)) {
        saveActiveElement();
        const autofocusElement = this.$refs.modal.querySelector(this.$options.autofocus) as HTMLElement;
        autofocusElement.focus();
      }
      return Promise.resolve();
    });
  }

  /**
   * Close the modal.
   */
  async close() {
    if (!this.isOpen) {
      return Promise.resolve();
    }

    this.$refs.modal.setAttribute('aria-hidden', 'true');

    if (this.$options.scrollLock) {
      document.documentElement.style.overflow = '';
    }

    this.isOpen = false;
    untrap();
    this.$emit('close');

    const refs = this.$refs;

    return Promise.all(
      Object.entries(this.$options.styles).map(
        ([refName, { open, active, closed } = { open: '', active: '', closed: '' }]) =>
          transition(
            refs[refName],
            {
              from: open,
              active,
              to: closed,
            },
            'keep',
          ),
      ),
    ).then(() => Promise.resolve());
  }
}
