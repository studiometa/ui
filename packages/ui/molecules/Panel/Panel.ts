import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { transition, matrix } from '@studiometa/js-toolkit/utils';
import { Modal } from '../Modal/index.js';

export interface PanelProps extends BaseProps {
  $options: {
    position: 'top' | 'right' | 'bottom' | 'left';
  };
}

const DEFAULT_POSITION = 'left';

/**
 * Panel class.
 */
export class Panel<T extends BaseProps = BaseProps> extends Modal<T & PanelProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Panel',
    options: {
      position: {
        type: String,
        default: DEFAULT_POSITION,
      },
    },
  };

  static translateClasses = {
    top: '-translate-y-full',
    right: 'translate-x-full',
    bottom: 'translate-y-full',
    left: '-translate-x-full',
  };

  isClosing = false;

  /**
   * Get the translation class.
   * @returns {string}
   */
  get translateClass() {
    return (
      Panel.translateClasses[this.$options.position] ?? Panel.translateClasses[DEFAULT_POSITION]
    );
  }

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
   *
   * @this {PanelInterface}
   * @returns {Promise<void>}
   */
  async open() {
    if (this.isOpen) {
      return Promise.resolve();
    }

    this.$refs.modal.classList.remove('pointer-events-none');
    transition(
      this.$refs.container,
      {
        from: {
          transform: this.containerOffset,
        },
        to: {
          transform: 'none',
        },
      },
      'keep',
    );
    transition(this.$refs.overlay, {
      from: 'opacity-0',
    });

    return super.open();
  }

  /**
   * Animate before closing.
   *
   * @this {PanelInterface}
   * @returns {Promise<void>}
   */
  async close() {
    if (!this.isOpen || this.isClosing) {
      return Promise.resolve();
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
        'keep',
      ),
      transition(
        this.$refs.overlay,
        {
          to: 'opacity-0',
        },
        'keep',
      ),
    ]);

    this.isClosing = false;

    return super.close();
  }
}
