import { registerComponent } from '@studiometa/js-toolkit';
import { FigureShopify } from '@studiometa/ui';

// The Twig and Liquid templates write `data-component="Figure"`. A component mounts on its
// configured name only, so the storefront variant is registered under that name by a subclass
// which declares it.
class Figure extends FigureShopify {
  static config = {
    name: 'Figure',
  };
}

registerComponent(Figure);
