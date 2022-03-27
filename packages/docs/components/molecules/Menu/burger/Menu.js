import { Menu as MenuCore, MenuBtn } from '@studiometa/ui';
import MenuItems from './MenuItems.js';

export default class Menu extends MenuCore {
  static config = {
    name: 'Menu',
    components: {
      Menu,
      MenuBtn,
      MenuItems,
    },
  };
}
