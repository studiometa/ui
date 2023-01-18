import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { animate, easeInOutExpo } from '@studiometa/js-toolkit/utils';
import type { Animate } from '@studiometa/js-toolkit/utils';
/**
 * Button Readmore class.
 */
export interface ReadmoreProps extends BaseProps {
  $refs: {
    btn: HTMLButtonElement;
    btnLabel: HTMLElement;
    mainContent: HTMLElement;
    hiddenContent: HTMLElement;
  };
  $options: {
    length: number;
    animate: boolean;
    btnLabelMore: string;
    btnLabelLess: string;
  };
}

/**
 * Readmore Class
 */
export default class Readmore<T extends BaseProps = BaseProps> extends Base<T & ReadmoreProps> {
  /**
   * Config
   */
  static config: BaseConfig = {
    name: 'Readmore',
    refs: ['btn', 'btnLabel', 'mainContent', 'hiddenContent'],
    options: {
      length: Number,
      animate: { type: Boolean, default: true },
      btnLabelMore: { type: String, default: 'Voir plus' },
      btnLabelLess: { type: String, default: 'Voir moins' },
    },
  };

  animation: Animate;

  /**
   * On mounted
   */
  mounted() {
    this.animation = animate(
      this.$refs.hiddenContent,
      [
        { x: 0, scaleY: 0, opacity: 0 },
        { x: 0, scaleY: 1, opacity: 1 },
      ],
      {
        duration: 0.1,
        easing: easeInOutExpo,
      },
    );
  }

  /**
   * Show the content
   */
  show() {
    setTimeout(() => {
      this.$refs.hiddenContent.classList.remove('hidden');
    }, 50);
    this.animation.start();
    this.$refs.btn.innerHTML = this.$options.btnLabelLess;
  }

  /**
   * Hide the content
   */
  hide() {
    this.$refs.hiddenContent.classList.add('hidden');
    this.$refs.btn.innerHTML = this.$options.btnLabelMore;
  }

  /**
   * Toggle the content visibility
   */
  toggle() {}

  /**
   * On button click
   */
  onBtnClick() {
    if (this.$refs.hiddenContent.classList.contains('hidden')) {
      this.show();
    } else {
      this.hide();
    }
  }
}
