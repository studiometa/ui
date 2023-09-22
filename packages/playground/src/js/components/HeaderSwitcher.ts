import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { domScheduler } from '@studiometa/js-toolkit/utils';
import { setHeaderVisibility, getHeaderVisibility } from '../store/header.js';

export interface HeaderSwitcherProps extends BaseProps {
  $refs: {
    show: HTMLButtonElement;
    hide: HTMLButtonElement;
  };
}

/**
 * HeaderSwitcher class.
 */
export default class HeaderSwitcher extends Base<HeaderSwitcherProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'HeaderSwitcher',
    refs: ['show', 'hide'],
  };

  mounted() {
    if (getHeaderVisibility() === 'visible') {
      this.show();
    } else {
      this.hide();
    }
  }

  onShowClick() {
    this.show();
  }

  onHideClick() {
    this.hide();
  }

  show() {
    setHeaderVisibility('visible');
    domScheduler.write(() => {
      this.$refs.show.classList.remove('flex');
      this.$refs.show.classList.add('hidden');
      this.$refs.hide.classList.remove('hidden');
      this.$refs.hide.classList.add('flex');
      this.$refs.hide.focus();
    });
  }

  hide() {
    setHeaderVisibility('hidden');
    domScheduler.write(() => {
      this.$refs.hide.classList.remove('flex');
      this.$refs.hide.classList.add('hidden');
      this.$refs.show.classList.remove('hidden');
      this.$refs.show.classList.add('flex');
      this.$refs.show.focus();
    });
  }
}
