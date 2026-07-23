import { registerComponent, withScrolledInView } from '@studiometa/js-toolkit';
import { Figure, ScrollAnimationTarget } from '@studiometa/ui';

class Parallax extends withScrolledInView(ScrollAnimationTarget) {
  static config = {
    ...ScrollAnimationTarget.config,
    name: 'Parallax',
    components: {
      Figure,
    },
  };

  get target() {
    return this.$children.Figure[0].$el;
  }
}

registerComponent(Parallax);
