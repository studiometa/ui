import { Base, createApp } from '@studiometa/js-toolkit';
import Readmore from '@studiometa/ui/molecules/Readmore/Readmore';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Readmore,
    },
  };
}

export default createApp(App, document.body);
