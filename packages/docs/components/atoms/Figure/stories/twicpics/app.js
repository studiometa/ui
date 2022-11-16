import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureTwicpics } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure: FigureTwicpics,
    },
  };
}

export default createApp(App, document.body);
