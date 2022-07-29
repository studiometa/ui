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

  /**
   * Trigger the `enter` transition on mount.
   *
   * @returns {void}
   */
  mounted() {
    const scroll = useScroll();

    if (!scroll.has('ScrollRevealRepeat')) {
      scroll.add('ScrollRevealRepeat', (props) => {
        ScrollRevealRepeat.scrollDirectionY = props.direction.y;
      });
    }

    if (ScrollRevealRepeat.scrollDirectionY !== 'UP') {
      this.enter();
    }
  }
}
