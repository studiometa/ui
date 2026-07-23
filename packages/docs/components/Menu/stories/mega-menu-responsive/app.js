import {
  registerComponent,
  withResponsiveOptions,
} from '@studiometa/js-toolkit';
import { Menu as MenuCore } from '@studiometa/ui';

class Menu extends withResponsiveOptions(MenuCore, {
  responsiveOptions: ['mode'],
}) {
  static config = {
    name: 'Menu',
    components: {
      ...MenuCore.config.components,
      Menu,
    },
  };
}

registerComponent(Menu);
