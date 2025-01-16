import { withResponsiveOptions, Base, createApp } from '@studiometa/js-toolkit@2.11';
import { Menu as MenuCore } from '@studiometa/ui';

class Menu extends withResponsiveOptions(MenuCore) {
  static config = {
    ...MenuCore.config,
    components: {
      ...MenuCore.config.components,
      Menu,
    },
    options: {
      ...MenuCore.config.options,
      mode: {
        ...MenuCore.config.options.mode,
        responsive: true,
      },
    },
  };
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Menu,
    },
  };
}

createApp(App, document.body);
