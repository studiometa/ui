import { Base, createApp } from '@studiometa/js-toolkit';
import { AnchorScrollTo } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      'a[href^="#"]': AnchorScrollTo,
    },
  };
}

export default createApp(App);
