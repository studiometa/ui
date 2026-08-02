import { registerComponent } from '@studiometa/js-toolkit';
import { Action } from '@studiometa/ui';

// No open/close logic: the Popover API handles it. Action only wires the
// scroll-lock side effect to the native `toggle` event.
registerComponent(Action);
