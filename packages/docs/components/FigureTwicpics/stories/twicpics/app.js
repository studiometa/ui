import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureTwicpics } from '@studiometa/ui';

class Figure extends FigureTwicpics {
  get domain() {
    return 'studiometa.twic.pics';
  }

  get path() {
    return 'ui';
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure,
    },
  };
}

export default createApp(App, document.body);
