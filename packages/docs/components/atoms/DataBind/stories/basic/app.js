import { Base, createApp } from '@studiometa/js-toolkit';
import { DataBind, DataModel, DataComputed } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      DataBind,
      DataModel,
      DataComputed,
    },
  };
}

export default createApp(App);
