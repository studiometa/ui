import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig, DragServiceProps } from '@studiometa/js-toolkit';
import { domScheduler, clamp } from '@studiometa/js-toolkit/utils';

export type ResizableSyncProps = BaseProps;

/**
 * ResizableSync class.
 */
export default class ResizableSync extends Base<ResizableSyncProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'ResizableSync',
  };

  previousSize = 0;

  sync(mode: DragServiceProps['mode'], axis: 'x' | 'y', distance: number) {
    if (mode === 'start') {
      domScheduler.read(() => {
        const size = axis === 'x' ? 'offsetWidth' : 'offsetHeight';
        this.previousSize = this.$el[size];
      });
    } else if (mode === 'drag') {
      domScheduler.read(() => {
        const minSize = 0;
        const maxSize = axis === 'x' ? window.innerWidth : window.innerHeight;
        domScheduler.write(() => {
          const size = axis === 'x' ? 'width' : 'height';
          const newSize = clamp(distance + this.previousSize, minSize, maxSize);
          this.$el.style[size] = `${newSize}px`;
        });
      });
    }
  }

  reset() {
    domScheduler.write(() => {
      this.$el.style.width = '';
      this.$el.style.height = '';
    });
  }
}
