import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { domScheduler } from '@studiometa/js-toolkit/utils';

export type EditorsProps = BaseProps;

/**
 * Editors class.
 */
export default class Editors extends Base<EditorsProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Editors',
  };

  hide() {
    domScheduler.write(() => {
      this.$el.classList.add('hidden');
    });
  }

  show() {
    domScheduler.write(() => {
      this.$el.classList.remove('hidden');
    });
  }
}
