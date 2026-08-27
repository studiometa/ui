import { registerComponents } from '@studiometa/js-toolkit';
import { Draggable, Action } from '@studiometa/ui';

// `Draggable` bounds its drag to the `parent` getter. Overriding it needs a distinct component
// name: `Draggable` registers itself when the module is imported, so a subclass reusing that name
// would be refused by the registry.
class RingDraggable extends Draggable {
  static config = {
    name: 'RingDraggable',
  };

  get parent() {
    return document.querySelector('.ring') ?? this.$el;
  }
}

registerComponents(RingDraggable, Action);
