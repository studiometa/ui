import { MenuList as MenuListCore } from '@studiometa/ui';

export default class MenuList extends MenuListCore {
  static config = {
    name: 'MenuList',
    components: {
      MenuList,
    },
  };

  /**
   * Assign required values for the transitions.
   */
  get $options() {
    const options = super.$options;

    options.enterTo = 'is-open';
    options.enterActive = 'transition duration-500 ease-out-expo';
    options.leaveActive = 'transition duration-500 ease-out-expo';
    options.leaveTo = 'transform -translate-x-full pointer-events-none';

    return options;
  }
}
