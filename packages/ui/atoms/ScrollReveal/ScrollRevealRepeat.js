import { useScroll } from '@studiometa/js-toolkit';
import ScrollReveal from './ScrollReveal.js';

/**
 * ScrollReveal class.
 */
export default class ScrollRevealRepeat extends ScrollReveal {
  /**
   * Config.
   */
  static config = {
    ...ScrollReveal.config,
    name: 'ScrollRevealRepeat',
  };

  /**
   * @type {'UP'|'DOWN'|'NONE'}
   */
  static scrollDirectionY;

  static {
    const scroll = useScroll();
    if (!scroll.has('ScrollRevealRepeat')) {
      scroll.add('ScrollRevealRepeat', (props) => {
        ScrollRevealRepeat.scrollDirectionY = props.direction.y;
      });
    }
  }

  /**
   * Trigger the `enter` transition on mount.
   *
   * @returns {void}
   */
  mounted() {
    if (ScrollRevealRepeat.scrollDirectionY !== 'UP') {
      this.enter();
    }
  }
}
