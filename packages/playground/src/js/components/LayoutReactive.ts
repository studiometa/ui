import { Base, getInstanceFromElement } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { domScheduler } from '@studiometa/js-toolkit/utils';
import { watchLayout, getLayout } from '../store/index.js';
import type { Layouts } from '../store/index.js';
import Resizable from './Resizable.js';

export interface LayoutReactiveProps extends BaseProps {
  $options: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
}

const layouts = ['top', 'right', 'bottom', 'left'];

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
      top: String,
      right: String,
      bottom: String,
      left: String,
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
      let toAdd = '';
      let toRemove = '';

      layouts.forEach((layout) => {
        if (value === layout) {
          toAdd = this.$options[layout];
        } else if (this.$options[layout]) {
          toRemove += ` ${this.$options[layout]}`;
        }
      });

      toAdd = toAdd.trim();
      toRemove = toRemove.trim();

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
