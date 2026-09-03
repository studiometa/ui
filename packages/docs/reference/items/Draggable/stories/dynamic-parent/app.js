import { registerComponents } from '@studiometa/js-toolkit';
import { Draggable, Action } from '@studiometa/ui';

// `Draggable` bounds its drag to the `parent` getter. Overriding it needs a distinct component
// name: the registry holds one class per name, so a subclass reusing `Draggable` would collide
// with the class registered below.
class RingDraggable extends Draggable {
  static config = {
    name: 'RingDraggable',
  };

  get parent() {
    return document.querySelector('.ring') ?? this.$el;
  }
}

registerComponents(RingDraggable, Action);
