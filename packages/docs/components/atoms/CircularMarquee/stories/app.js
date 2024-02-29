import { Base, createApp } from '@studiometa/js-toolkit';
import { CircularMarquee } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      CircularMarquee,
    },
  };
}

export default createApp(App, document.body);
