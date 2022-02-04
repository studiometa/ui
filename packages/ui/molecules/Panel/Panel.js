import { transition, matrix } from '@studiometa/js-toolkit/utils';
import Modal from '../Modal/Modal.js';

/**
 * @typedef {import('../Modal/Modal.js').ModalInterface} ModalInterface
 * @typedef {Panel & ModalInterface} PanelInterface
 */

/**
 * Panel class.
 */
export default class Panel extends Modal {
  static config = {
    name: 'Panel',
    options: {
      position: {
        type: String,
        default: 'left',
      },
    },
  };

  static translateClasses = {
    top: '-translate-y-full',
    right: 'translate-x-full',
    bottom: 'translate-y-full',
    left: '-translate-x-full',
  };

  /**
   * Get the translation class.
   * @returns {string}
   */
  get translateClass() {
    return (
      Panel.translateClasses[this.$options.position] ??
      Panel.translateClasses[Panel.config.options.position.default]
    );
  }

  /**
   * @this {PanelInterface}
   */
  get containerOffset() {
    const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = this.$refs.container;

    const store = {
      top: {
        translateY: (offsetTop + offsetHeight) * -1,
      },
      right: {
        translateX: window.innerWidth - offsetLeft + offsetWidth * 2,
      },
      bottom: {
        translateY: window.innerHeight - offsetTop + offsetHeight * 2,
      },
      left: {
        translateX: (offsetLeft + offsetWidth) * -1,
      },
    };

    return matrix(store[this.$options.position]);
  }

  /**
   * Animate before opening.
   * @this {PanelInterface}
   */
  async open() {
    if (this.isOpen) {
      return;
    }

    this.$refs.modal.classList.remove('pointer-events-none');
    transition(this.$refs.container, {
      from: {
        transform: this.containerOffset,
      },
      to: {
        transform: 'none',
      },
    }, 'keep');
    transition(this.$refs.overlay, {
      from: 'opacity-0',
    });

    return super.open();
  }

  /**
   * Animate before closing
   * @this {PanelInterface}
   */
  async close() {
    if (!this.isOpen) {
      return;
    }

    if (this.isClosing) {
      return;
    }

    this.isClosing = true;

    this.$refs.modal.classList.add('pointer-events-none');
    await Promise.all([
      transition(
        this.$refs.container,
        {
          from: {
            transform: 'none',
          },
          to: {
            transform: this.containerOffset,
          },
        },
        'keep'
      ),
      transition(
        this.$refs.overlay,
        {
          to: 'opacity-0',
        },
        'keep'
      ),
    ]);

    this.isClosing = false;

    return super.close();
  }
}
