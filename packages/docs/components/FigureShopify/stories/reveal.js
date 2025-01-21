import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureShopify, Transition } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure: FigureShopify,
      Transition,
    },
  };
}

export default createApp(App, document.body);
