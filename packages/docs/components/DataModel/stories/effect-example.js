import { Base, createApp } from '@studiometa/js-toolkit';
import { DataBind, DataEffect, DataModel } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      DataBind,
      DataEffect,
      DataModel,
    },
  };
}

export default createApp(App);
