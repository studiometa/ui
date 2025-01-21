import { Base, createApp } from '@studiometa/js-toolkit';
import { Panel } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Panel,
    },
  };
}

export default createApp(App, document.body);
