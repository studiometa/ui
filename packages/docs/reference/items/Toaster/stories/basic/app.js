import { registerComponent } from '@studiometa/js-toolkit';
import { Action, Toaster } from '@studiometa/ui';

// Registering `Toaster` also registers its `Toast` child, so every inserted
// toast is mounted by the registry.
registerComponent(Action);
registerComponent(Toaster);
