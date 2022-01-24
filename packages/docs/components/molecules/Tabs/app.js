import { Base, createApp } from '@studiometa/js-toolkit';
import { Tabs } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Tabs,
    },
  };
}

export default createApp(App, document.body);
