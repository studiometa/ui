import { Base, createApp } from '@studiometa/js-toolkit';
import { LargeText } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      LargeText,
    },
  };
}

export default createApp(App);
