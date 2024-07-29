import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, DataBind as DataBindCore } from '@studiometa/ui';

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
    },
  };
}

export default createApp(App);
