import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { Modal } from './Modal.js';

/**
 * ModalWithTransition class.
 */
export default class ModalWithTransition<T extends BaseProps = BaseProps> extends Modal<T> {
  /**
   * Modal options.
   */
  static config:BaseConfig = {
    name: 'ModalWithTransition',
    options: {
      styles: {
        type: Object,
        /**
         * @returns {ModalStylesOption}
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

  open() {
    this.$refs.modal.style.visibility = '';
    return super.open();
  }

  async close() {
    await super.close();
    this.$refs.modal.style.visibility = 'hidden';
    return Promise.resolve();
  }
}
