import { Base, createApp } from '@studiometa/js-toolkit';
import { DataBind, DataComputed, DataEffect, DataModel } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      DataBind,
      DataComputed,
      DataEffect,
      DataModel,
    },
  };
}

export default createApp(App);
