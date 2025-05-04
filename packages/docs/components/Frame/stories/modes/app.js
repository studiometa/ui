import { Base, createApp } from '@studiometa/js-toolkit';
import { Frame } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Frame,
    }
  };
}

export default createApp(App);
