import { useScroll } from '@studiometa/js-toolkit';
import ScrollReveal from 'ScrollReveal.js';

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

  static scrollDirectionY;

  static {
    const scroll = useScroll();
    if (!scroll.has('ScrollReveal')) {
      scroll.add('ScrollReveal', (props) => {
        ScrollReveal.scrollDirectionY = props.direction.y;
      });
    }
  }

  /**
   * Trigger the `enter` transition on mount.
   *
   * @this {ScrollRevealInterface}
   * @returns {void}
   */
  mounted() {
    if (ScrollReveal.scrollDirectionY !== 'UP') {
      this.enter();
    }
  }
}
