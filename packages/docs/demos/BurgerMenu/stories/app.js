import { Base, createApp } from '@studiometa/js-toolkit';
import { Menu as MenuCore, MenuList as MenuListCore, MenuBtn, Transition } from '@studiometa/ui';

class MenuList extends MenuListCore {
  static config = {
    ...MenuListCore.config,
    components: {
      MenuList,
      Transition,
    }
  }

  onItemsOpen() {
    this.$children.Transition.forEach(transition => transition.enter());
  }

  onItemsClose() {
    this.$children.Transition.forEach(transition => transition.leave());
  }
}

class Menu extends MenuCore {
  static config = {
    ...MenuCore.config,
    components: {
      Menu,
      MenuList,
      MenuBtn,
    }
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Menu,
    }
  };
}

createApp(App)
