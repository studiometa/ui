import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureVideoTwicpics } from '@studiometa/ui';

class FigureVideo extends FigureVideoTwicpics {
  get domain() {
    return 'studiometa.twic.pics';
  }

  get path() {
    return 'ui-videos';
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      FigureVideo,
    },
  };
}

export default createApp(App, document.body);
