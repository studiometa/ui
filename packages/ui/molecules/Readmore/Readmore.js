import { Base } from '@studiometa/js-toolkit';
import { animate, easeInOutExpo } from '@studiometa/js-toolkit/utils';
/**
 * Button Readmore class.
 */
export default class Readmore extends Base {
  /**
   * Class cfnig
   * @type {Object}
   */
  static config = {
    name: 'Readmore',
    refs: ['btn', 'btnLabel', 'main_content', 'hidden_content'],
    options: {
      length: Number,
      amimate: { type: Boolean, default: 'true' },
      btnLabelMore: { type: String, default: 'Voir plus' },
      btnLabelLess: { type: String, default: 'Voir moins' },
    },
  };

  /**
   * On mounted
   */
  mounted() {
    this.hiddenContent = this.$refs.hidden_content;
    this.mainContent = this.$refs.main_content;
    this.btn = this.$refs.btn;

    this.animation = animate(
      this.hiddenContent,
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
   * On btn click
   * @returns {void}
   */
  onBtnClick() {
    if (this.hiddenContent.classList.contains('hidden')) {
      setTimeout(() => {
        this.hiddenContent.classList.remove('hidden');
      }, 50);
      this.animation.start();
      this.btn.innerHTML = this.$options.btnLabelLess;
    } else {
      this.hiddenContent.classList.add('hidden');
      this.btn.innerHTML = this.$options.btnLabelMore;
    }
  }
}
