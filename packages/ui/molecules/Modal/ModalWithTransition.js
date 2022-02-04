import { withExtraConfig } from '@studiometa/js-toolkit';
import Modal from './Modal.js';

/**
 * @typedef {import('./Modal.js').ModalInterface} ModalInterface
 * @typedef {ModalInterface & ModalWithTransition} ModalWithTransitionInterface
 */
/**
 * ModalWithTransition class.
 */
export default class ModalWithTransition extends withExtraConfig(Modal, {
  options: {
    styles: {
      type: Object,
      default: () => ({
        modal: {
          closed: {
            opacity: '0',
            pointerEvents: 'none',
          },
          active: 'transition duration-500 ease-out-expo',
        },
        overlay: {
          closed: 'opacity-0',
          active: 'transition duration-500 ease-out-expo',
        },
        container: {
          closed: 'transform scale-95 opacity-0',
          active: 'transition duration-500 ease-out-expo',
        },
      }),
    },
  },
}) {
  /**
   * Modal options.
   */
  static config = {
    name: 'ModalWithTransition',
  };

  /**
   * @this {ModalWithTransitionInterface}
   */
  open() {
    this.$refs.modal.style.visibility = '';
    return super.open();
  }

  /**
   * @this {ModalWithTransitionInterface}
   */
  async close() {
    await super.close();
    this.$refs.modal.style.visibility = 'hidden';
    return Promise.resolve(this);
  }
}
