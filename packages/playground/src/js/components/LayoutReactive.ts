import { Base, getInstanceFromElement } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { domScheduler } from '@studiometa/js-toolkit/utils';
import { watchLayout, getLayout } from '../store/index.js';
import type { Layouts } from '../store/index.js';
import Resizable from './Resizable.js';

export interface LayoutReactiveProps extends BaseProps {
  $options: {
    horizontal: string;
    vertical: string;
  };
}

/**
 * LayoutReactive class.
 */
export default class LayoutReactive extends Base<LayoutReactiveProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'LayoutReactive',
    options: {
      horizontal: String,
      vertical: String,
    },
  };

  mounted() {
    this.switch(getLayout());
    watchLayout((value: Layouts) => {
      this.switch(value);
    });
  }

  switch(value: Layouts) {
    domScheduler.read(() => {
      const { horizontal, vertical } = this.$options;
      const toAdd = value === 'horizontal' ? horizontal : vertical;
      const toRemove = value === 'horizontal' ? vertical : horizontal;

      if (toRemove.length) {
        domScheduler.write(() => {
          this.$el.classList.remove(...toRemove.split(' '));
        });
      }

      if (toAdd.length) {
        domScheduler.write(() => {
          this.$el.classList.add(...toAdd.split(' '));
        });
      }

      const maybeResizable = getInstanceFromElement(this.$el, Resizable);
      if (maybeResizable) {
        maybeResizable.reset();
      }
    });
  }
}
