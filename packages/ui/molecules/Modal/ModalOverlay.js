import { Transition } from '../../primitives/index.js';

/**
 * ModalOverlay class.
 */
export default class ModalOverlay extends Transition {
  /**
   * Config.
   */
  static config = {
    ...Transition.config,
    name: 'ModalOverlay',
  };
}
