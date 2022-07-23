import {
  ScrollAnimationParent as ScrollAnimationParentCore,
  ScrollAnimationChild,
} from '@studiometa/ui';

export default class ScrollAnimationParent extends ScrollAnimationParentCore {
  static config = {
    name: 'ScrollAnimationParent',
    components: {
      ScrollAnimationChild,
    },
  };
}
