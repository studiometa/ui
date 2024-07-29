import { Base, createApp } from '@studiometa/js-toolkit';
import { Action } from '@studiometa/ui';

class Foo extends Base {
  static config = {
    name: 'Foo',
  };
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      Foo,
    },
  };
}

export default createApp(App);
