import { Menu as MenuCore, MenuBtn } from '@studiometa/ui';
import MenuList from './MenuList.js';

export default class Menu extends MenuCore {
  static config = {
    name: 'Menu',
    components: {
      Menu,
      MenuBtn,
      MenuList,
    },
  };
}
