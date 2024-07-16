import { Base, createApp } from '@studiometa/js-toolkit';
import { DataBind, DataComputed, DataModel } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      DataBind,
      DataComputed,
      DataModel,
    },
  };
}

export default createApp(App);
