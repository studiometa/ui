import { type BaseConfig, type BaseProps, type MountedReturn } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';
import type { CarouselState } from './context.js';

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
    if (
      !this.$el.hasAttribute('aria-label') &&
      !this.$el.hasAttribute('aria-labelledby') &&
      !this.$el.textContent?.trim()
    ) {
      this.$warn(
        'carousel.unnamed-btn',
        `The \`${this.$options.action}\` button has no accessible name. Give it text, an \`aria-label\` or an \`aria-labelledby\`.`,
      );
    }

    return super.mounted();
  }

  /**
   * Navigate, unless the action would not move.
   *
   * A picker marked `aria-disabled` still receives the click — that is the
   * whole point of the attribute — so the no-op is this method's job.
   */
  onClick(): void {
    const { carousel } = this;
    if (!carousel || this.$el.getAttribute('aria-disabled') === 'true') {
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
   * Disable the button when its action would not move the index.
   *
   * `prevIndex`/`nextIndex` already encode the `boundary` and `reverse`
   * options, so `loop` and `bounce` never disable an end and `reverse` flips
   * which end is terminal. They travel on the state rather than being read off
   * the coordinator, which is the whole reason no control imports its class.
   *
   * **How it is disabled depends on which button it is.** A picker uses
   * `aria-disabled`, as the APG's grouped-buttons variant requires: the button
   * for the slide already showing is the one a screen reader user is most
   * likely to look for, and the native `disabled` attribute takes it out of
   * the tab order and the accessibility tree entirely, so the set of dots
   * silently loses one every time the carousel moves. A `prev`/`next` button
   * keeps `disabled`: it names an action that genuinely cannot be performed,
   * the APG prescribes nothing for it, and the tab order stays stable because
   * the two ends are never disabled at the same time.
   */
  update({ index, prevIndex, nextIndex }: CarouselState): void {
    const { action } = this.$options;

    if (action === STEP_ACTIONS.NEXT) {
      this.$el.disabled = nextIndex === index;
    } else if (action === STEP_ACTIONS.PREVIOUS) {
      this.$el.disabled = prevIndex === index;
    } else {
      this.$el.setAttribute('aria-disabled', String(Number(action) === index));
    }
  }
}
