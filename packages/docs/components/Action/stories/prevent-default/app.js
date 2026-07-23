import { Base, registerComponent } from '@studiometa/js-toolkit';
import { Action } from '@studiometa/ui';

class Foo extends Base {
  static config = {
    name: 'Foo',
  };
}

registerComponent(Action);
registerComponent(Foo);
