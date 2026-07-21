import { registerComponent } from '@studiometa/js-toolkit';
import { Indexable, Action, DataBind, DataComputed } from '@studiometa/ui';

// No App and no subclass: Indexable owns the index (with `total` and
// `boundary`), a co-located Action bridges its `index` event to the
// DataBind/DataComputed renderers. No Slider component is registered.
registerComponent(Indexable);
registerComponent(Action);
registerComponent(DataBind);
registerComponent(DataComputed);
