import { registerComponent } from '@studiometa/js-toolkit';
import { Action, ViewTransition } from '@studiometa/ui';

class Togglable extends ViewTransition {
  static config = {
    name: 'Togglable',
  };
}

registerComponent(Action);
registerComponent(Togglable);
