import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { domScheduler } from '@studiometa/js-toolkit/utils';
import { setHeaderVisibility, getHeaderVisibility, headerIsVisible } from '../store/header.js';

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
    this.update(headerIsVisible());
  }

  onShowClick() {
    this.show();
  }

  onHideClick() {
    this.hide();
  }

  show() {
    setHeaderVisibility('visible');
    this.update(headerIsVisible());
    this.$refs.hide.focus();
  }

  hide() {
    setHeaderVisibility('hidden');
    this.update(headerIsVisible());
    this.$refs.show.focus();
  }

  update(isVisible) {
    domScheduler.write(() => {
      this.$refs.hide.classList.toggle('flex', isVisible);
      this.$refs.show.classList.toggle('flex', !isVisible);
      this.$refs.hide.classList.toggle('hidden', !isVisible);
      this.$refs.show.classList.toggle('hidden', isVisible);
    });
  }
}
