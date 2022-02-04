import Modal from './Modal.js';

/**
 * @typedef {import('./Modal.js').ModalInterface} ModalInterface
 * @typedef {import('./Modal.js').ModalStylesOption} ModalStylesOption
 * @typedef {ModalInterface & ModalWithTransition} ModalWithTransitionInterface
 */
/**
 * ModalWithTransition class.
 */
// @ts-ignore
// eslint-disable-next-line require-jsdoc
export default class ModalWithTransition extends Modal {
  /**
   * Modal options.
   */
  static config = {
    name: 'ModalWithTransition',
    options: {
      styles: {
        type: Object,
        /**
         * @return {ModalStylesOption}
         */
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
    return Promise.resolve();
  }
}
