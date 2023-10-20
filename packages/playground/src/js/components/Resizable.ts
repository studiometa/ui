import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig, DragServiceProps } from '@studiometa/js-toolkit';
import { domScheduler, clamp } from '@studiometa/js-toolkit/utils';
import { layoutIsVertical, layoutIs } from '../store/index.js';
import ResizableCursorY from './ResizableCursorY.js';
import ResizableCursorX from './ResizableCursorX.js';
import ResizableSync from './ResizableSync.js';

export interface ResizableProps extends BaseProps {
  $children: {
    ResizableCursorY: ResizableCursorY[];
    ResizableCursorX: ResizableCursorX[];
    ResizableSync: ResizableSync[];
  };
}

export default class Resizable extends Base<ResizableProps> {
  static config: BaseConfig = {
    name: 'Resizable',
    components: {
      ResizableCursorY,
      ResizableCursorX,
      ResizableSync,
    },
    emits: ['dragged'],
  };

  previousSize = 0;

  onResizableCursorYDragged(props: DragServiceProps) {
    const method = layoutIsVertical() ? 'resizeSync' : 'resize';
    this[method](props.mode, 'y', props.distance);
    this.$emit('dragged', props);
  }

  onResizableCursorXDragged(props: DragServiceProps) {
    const method = layoutIsVertical() ? 'resize' : 'resizeSync';
    this[method](props.mode, 'x', props.distance);
    this.$emit('dragged', props);
  }

  resize(mode: DragServiceProps['mode'], axis: 'x' | 'y', distance: DragServiceProps['distance']) {
    if (layoutIs('right') || layoutIs('bottom')) {
      distance.x *= -1;
      distance.y *= -1;
    }

    if (mode === 'start') {
      domScheduler.read(() => {
        const size = axis === 'x' ? 'offsetWidth' : 'offsetHeight';
        this.previousSize = this.$el[size];
      });
    } else if (mode === 'drag') {
      domScheduler.write(() => {
        const size = axis === 'x' ? 'width' : 'height';
        const minSize = 8;
        const maxSize = axis === 'x' ? window.innerWidth : window.innerHeight - 48;
        const newSize = clamp(distance[axis] + this.previousSize, minSize, maxSize);
        this.$el.style[size] = `${newSize}px`;
      });
    }
  }

  resizeSync(
    mode: DragServiceProps['mode'],
    axis: 'x' | 'y',
    distance: DragServiceProps['distance'],
  ) {
    const [first, second] = this.$children.ResizableSync;
    first.sync(mode, axis, distance[axis]);
    second.sync(mode, axis, distance[axis] * -1);
  }

  reset() {
    domScheduler.write(() => {
      this.$el.style.width = '';
      this.$el.style.height = '';
    });
    this.$children.ResizableSync.forEach((resizable) => resizable.reset());
  }
}
