import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureShopify } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure: FigureShopify,
    },
  };
}

export default createApp(App, document.body);
