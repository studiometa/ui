import { Base, createApp } from '@studiometa/js-toolkit';
import { FigureTwicPics } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure: FigureTwicPics,
    },
  };
}

export default createApp(App, document.body);
