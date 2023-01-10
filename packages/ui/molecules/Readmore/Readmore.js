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
    refs: ['button', 'main_content', 'hidden_content'],
    options: {
      length: Number,
      amimate: { type: Boolean, default: 'true' },
    },
  };

  /**
   * On mounted
   */
  mounted() {
    this.hiddenContent = this.$refs.hidden_content;
    this.mainContent = this.$refs.main_content;

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
  onButtonClick() {
    setTimeout(() => {
      this.hiddenContent.classList.remove('hidden');
    }, 100);

    this.animation.start();
  }
}
