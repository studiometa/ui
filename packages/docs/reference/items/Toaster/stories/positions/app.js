import { registerComponent } from '@studiometa/js-toolkit';
import { Action, Toaster } from '@studiometa/ui';

// Registering `Toaster` also registers its `Toast` child, so every inserted
// toast is mounted by the registry — for each of the four corner toasters.
registerComponent(Action);
registerComponent(Toaster);
