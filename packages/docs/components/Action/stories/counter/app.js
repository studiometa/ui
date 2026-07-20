import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, DataBind, DataComputed } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      DataBind,
      DataComputed,
    },
  };
}

export default createApp(App);
