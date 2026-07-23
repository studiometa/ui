import { registerComponent } from '@studiometa/js-toolkit';
import { Draggable as DraggableCore, Action } from '@studiometa/ui';

class Draggable extends DraggableCore {
  get parent() {
    return document.querySelector('.ring') ?? this.$el;
  }
}

registerComponent(Draggable);
registerComponent(Action);
