import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureVideo } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      FigureVideo,
    },
  };
}

export default createApp(App, document.body);
