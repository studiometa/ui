import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, DataBind as DataBindCore, DataComputed } from '@studiometa/ui';

class DataBind extends DataBindCore {
  get() {
    return Number(super.get());
  }
}

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
