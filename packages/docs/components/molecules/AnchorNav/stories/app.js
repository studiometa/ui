/* eslint-disable max-classes-per-file */
import { Base, createApp } from '@studiometa/js-toolkit';
import { AnchorNav } from '@studiometa/ui';

/**
 *
 */
class App extends Base {
  static config = {
    name: 'App',
    components: {
      AnchorNav,
    },
  };
}

createApp(App, document.body);
