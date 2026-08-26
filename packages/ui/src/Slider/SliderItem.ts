import { Base, useRaf, useResize, type MountedReturn } from '@studiometa/js-toolkit';
import { damp } from '@studiometa/js-toolkit/utils';

export interface SliderItemRect {
  x: number;
  width: number;
}

/**
 * One slide with cached geometry and damped horizontal movement.
 *
 * @link https://ui.studiometa.dev/reference/items/Slider/
 */
export class SliderItem extends Base {
  static config = { name: 'SliderItem' };

  /** Target position. */
  x = 0;

  /** Smoothed position. */
  dampedX = 0;

  /**
   * Cached untranslated geometry, invalidated on resize.
   * @private
   */
  __rect: SliderItemRect | null = null;

  /**
   * Releases the frame subscription while the slide is settling.
   * @private
   */
  __unsubscribeFrame: (() => void) | null = null;

  /** Position and width as if the slide were untranslated. */
  get rect(): SliderItemRect {
    if (!this.__rect) {
      const rect = this.$el.getBoundingClientRect();
      this.__rect = { x: rect.left - this.dampedX, width: rect.width };
    }
    return this.__rect;
  }

  mounted(): MountedReturn {
    this.$el.setAttribute('role', 'group');
    this.$el.setAttribute('aria-roledescription', 'slide');
    this.$el.setAttribute('aria-label', this.$id);

    return [
      useResize().subscribe(() => {
        this.__rect = null;
      }),
      () => this.__stopTicking(),
    ];
  }

  unmounted(): void {
    this.moveInstantly(0);
  }

  activate(): void {
    this.$el.classList.add('is-active');
  }

  disactivate(): void {
    this.$el.classList.remove('is-active');
  }

  /** Move with inertia. */
  move(targetPosition: number): void {
    this.x = targetPosition;
    this.__startTicking();
  }

  /** Move now, no animation. */
  moveInstantly(targetPosition: number): void {
    this.x = targetPosition;
    this.dampedX = targetPosition;
    this.$write(() => this.render());
  }

  render(): void {
    this.$el.style.transform = `translate3d(${this.dampedX}px, 0px, 0px)`;
  }

  /**
   * Start damping towards the target position, once.
   * @private
   */
  __startTicking(): void {
    this.__unsubscribeFrame ??= useRaf().subscribe(({ delta }) => {
      this.dampedX = damp(this.x, this.dampedX, 0.1, delta, 0.00001);
      if (this.dampedX === this.x) {
        this.__stopTicking();
      }
      return () => this.render();
    });
  }

  /**
   * Leave the frame service once the slide has settled.
   * @private
   */
  __stopTicking(): void {
    this.__unsubscribeFrame?.();
    this.__unsubscribeFrame = null;
  }
}
