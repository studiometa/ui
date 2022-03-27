import { MenuItems as MenuItemsCore } from '@studiometa/ui';

export default class MenuItems extends MenuItemsCore {
  static config = {
    name: 'MenuItems',
    components: {
      MenuItems,
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
