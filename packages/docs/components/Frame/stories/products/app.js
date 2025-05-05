import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, Frame, Figure, Panel } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      Frame,
      Figure,
      Panel,
    }
  };
}

export default createApp(App);
