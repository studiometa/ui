/* eslint-disable max-classes-per-file */
import { Base, createApp } from '@studiometa/js-toolkit';
import {
  AnchorNav as AnchorNavCore,
  AnchorNavLink,
  AnchorNavTarget,
} from '@studiometa/ui';

/**
 *
 */
class AnchorNav extends AnchorNavCore {
  static config = {
    components: {
      AnchorNavLink,
      AnchorNavTarget,
    },
  };
}

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
