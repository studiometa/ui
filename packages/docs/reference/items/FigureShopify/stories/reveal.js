import { registerComponent } from '@studiometa/js-toolkit';
import { FigureShopify, Transition } from '@studiometa/ui';

// The templates write `data-component="Figure"`, so the storefront variant is registered under
// that name.
//
// v1 synchronised the two halves of this reveal with `Transition`'s `group` option, which
// collected sibling instances from a global registry. v4 keeps no such registry, so the figure
// drives the overlay it contains through `$query()` instead — an explicit relationship rather
// than a shared string.
class Figure extends FigureShopify {
  static config = {
    name: 'Figure',
    components: { Transition },
  };

  get overlay() {
    return this.$query('Transition')[0];
  }

  async enter(target) {
    await Promise.all([super.enter(target), this.overlay?.enter()]);
  }

  async leave(target) {
    await Promise.all([super.leave(target), this.overlay?.leave()]);
  }
}

registerComponent(Figure);
