import { Figure, ScrollAnimationChild } from '@studiometa/ui';

export default class ParallaxChild extends ScrollAnimationChild {
  static config = {
    ...ScrollAnimationChild.config,
    name: 'ParallaxChild',
    components: {
      Figure,
    },
  };

  get target() {
    return this.$children.Figure[0].$el;
  }
}
