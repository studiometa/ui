import type { BaseConfig, BaseProps, MountedReturn } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';
import type { CarouselState } from './context.js';
import { hasAccessibleName } from './utils.js';

export type CarouselBtnProps = BaseProps & {
  $el: HTMLButtonElement;
  $options: {
    action: string;
  };
};

/** The two step actions, as opposed to a numeric slide-picker action. */
const STEP_ACTIONS = Object.freeze({
  NEXT: 'next',
  PREVIOUS: 'prev',
} as const);

/** A `next`, `prev` or numeric navigation button. */
export class CarouselBtn<T extends BaseProps = BaseProps> extends AbstractCarouselChild<
  CarouselBtnProps & T
> {
  static config: BaseConfig = {
    name: 'CarouselBtn',
    options: { action: String },
  };

  /** Whether this button picks one slide, rather than stepping. */
  get isPicker(): boolean {
    const { action } = this.$options;
    return action !== STEP_ACTIONS.NEXT && action !== STEP_ACTIONS.PREVIOUS;
  }

  /**
   * Check the button can be announced.
   *
   * A dot is the usual offender: an empty `<button>` with a background, or one
   * holding nothing but an `aria-hidden` icon. It is a tab stop with no name,
   * which is a WCAG 4.1.2 failure and the single most common carousel defect
   * an audit finds.
   */
  mounted(): MountedReturn {
    if (!hasAccessibleName(this.$el)) {
      this.$warn(
        'carousel.unnamed-btn',
        `The \`${this.$options.action}\` button has no accessible name. Give it text, an \`aria-label\` or an \`aria-labelledby\`.`,
      );
    }

    return super.mounted();
  }

  /** Navigate. */
  onClick(): void {
    const { carousel } = this;
    if (!carousel) {
      return;
    }

    const { action } = this.$options;
    switch (action) {
      case STEP_ACTIONS.NEXT:
        carousel.goNext();
        break;
      case STEP_ACTIONS.PREVIOUS:
        carousel.goPrev();
        break;
      default:
        carousel.goTo(Number(action));
        break;
    }
  }

  /**
   * Reflect what the button can do, which depends on which button it is.
   *
   * A `prev`/`next` button names an action, so at the end of the track the
   * action genuinely cannot be performed and the native `disabled` property
   * says so. The tab order stays stable because the two ends are never
   * terminal at once. `prevIndex`/`nextIndex` already encode the `boundary`
   * and `reverse` options, so `loop` and `bounce` never disable an end and
   * `reverse` flips which end is terminal — and they travel on the state
   * rather than being read off the coordinator, which is the whole reason no
   * control imports its class.
   *
   * A numeric button names a slide rather than an action, which makes it a
   * picker: the same job as a dot or a thumbnail, so it carries the same
   * marker, `aria-current="true"`. One marker across the four pickers means
   * one CSS hook — style `[aria-current='true']` — and `aria-current` is the
   * attribute for "the current item within a set", which is exactly the claim.
   * It is never `disabled` in either form: the picker for the slide on screen
   * is the one a screen reader user looks for, so removing it from the
   * accessibility tree, or announcing it as unavailable, both lose more than
   * they say. Clicking it re-runs `goTo()` on the index already shown, which
   * moves nothing.
   */
  update({ index, prevIndex, nextIndex }: CarouselState): void {
    const { action } = this.$options;

    if (action === STEP_ACTIONS.NEXT) {
      this.$el.disabled = nextIndex === index;
    } else if (action === STEP_ACTIONS.PREVIOUS) {
      this.$el.disabled = prevIndex === index;
    } else if (Number(action) === index) {
      this.$el.setAttribute('aria-current', 'true');
    } else {
      this.$el.removeAttribute('aria-current');
    }
  }
}
