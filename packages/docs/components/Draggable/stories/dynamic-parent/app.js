import { Base, createApp } from '@studiometa/js-toolkit';
import { Draggable as DraggableCore, Action } from '@studiometa/ui';

class Draggable extends DraggableCore {
  get parent() {
    return document.querySelector('.ring') ?? this.$el;
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Draggable,
      Action,
    },
  };
}

export default createApp(App);
