import { withResponsiveOptions } from '@studiometa/js-toolkit';
import { Menu as MenuCore } from '@studiometa/ui';

export default class Menu extends withResponsiveOptions(MenuCore) {
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
