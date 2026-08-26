import { Base } from '@studiometa/js-toolkit';
import { SliderContext } from './Slider.js';

export interface SliderBtnProps {
  $el: HTMLButtonElement;
  $options: { prev: boolean; next: boolean };
}

/**
 * Previous or next control. State waits for a Slider context; clicks use the
 * current context and do nothing when none exists.
 *
 * @link https://ui.studiometa.dev/reference/items/Slider/
 */
export class SliderBtn extends Base<SliderBtnProps> {
  static config = {
    name: 'SliderBtn',
    options: { prev: Boolean, next: Boolean },
  };

  async mounted() {
    const { state } = await this.$inject(SliderContext);
    return state.subscribe(
      ({ index, total }) => {
        this.$write(() => this.update(index, total));
      },
      { immediate: true },
    );
  }

  update(index: number, total: number): void {
    const isFirst = index === 0 && this.$options.prev;
    const isLast = index >= total - 1 && this.$options.next;
    this.$el.toggleAttribute('disabled', isFirst || isLast);
  }

  onClick(): void {
    const api = this.$injectSync(SliderContext);
    if (this.$options.prev) {
      api?.goPrev();
    } else if (this.$options.next) {
      api?.goNext();
    }
  }
}
