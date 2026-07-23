import { registerComponent } from '@studiometa/js-toolkit';
import {
  ScrollAnimationTimeline,
  ScrollAnimationTarget,
  withScrollAnimationDebug,
} from '@studiometa/ui';

registerComponent(
  withScrollAnimationDebug(ScrollAnimationTimeline),
  'ScrollAnimationTimeline',
);
registerComponent(ScrollAnimationTarget);
