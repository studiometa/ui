import { Figure, ScrollAnimationParent } from '@studiometa/ui';
import ParallaxChild from './ParallaxChild.js';

export default class ParallaxParent extends ScrollAnimationParent {
  static config = {
    ...ScrollAnimationParent.config,
    name: 'ParallaxParent',
    components: {
      ParallaxChild,
    },
  };

  get target() {
    return this.$children.Figure[0].$el;
  }

  scrolledInView(props) {
    this.$children.ParallaxChild.forEach((child) => {
      child.scrolledInView(props);
    });
  }
}
