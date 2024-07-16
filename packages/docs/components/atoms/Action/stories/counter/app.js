import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, DataBind } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      DataBind,
    },
  };
}

export default createApp(App);
