// eslint-disable-next-line max-classes-per-file
import { Base, createApp } from '@studiometa/js-toolkit';
import { Menu as MenuCore, MenuList as MenuListCore, MenuBtn } from '@studiometa/ui';

/**
 * Menu class
 */
class Menu extends MenuCore {
  static config = {
    name: 'Menu',
    components: {
      Menu,
    },
  };
}

/**
 * Menu List class
 */
class MenuList extends MenuListCore {
  static config = {
    name: 'MenuList',
    components: {
      MenuList,
    },
  };

  /**
   * Assign required values for the transitions.
   * return @void
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

/**
 * App class
 */
class App extends Base {
  static config = {
    name: 'App',
    components: {
      Menu,
      MenuList,
      MenuBtn,
    },
  };
}

createApp(App);
