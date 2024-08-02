import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { Sentinel } from '../../primitives/index.js';

/**
 * @typedef {object} StickyRefs
 * @property {HTMLElement} inner
 * @property {HTMLElement} sentinelRef
 */

/**
 * @typedef {object} StickyPrivateInterface
 * @property {StickyRefs} $refs
 * @property {{ zIndex: number, hideWhenUp: boolean, hideWhenDown: boolean }} $options
 * @property {{ Sentinel: Sentinel[] }} $children
 */

export interface StickyProps extends BaseProps {
  $refs: {
    inner: HTMLElement;
    sentinelRef: HTMLElement;
  };
  $options: {
    zIndex: number;
    hideWhenUp: boolean;
    hideWhenDown: boolean;
  };
  $children: {
    Sentinel: Sentinel[];
  };
}

/**
 * Sticky class.
 */
export class Sticky<T extends BaseProps = BaseProps> extends Base<T & StickyProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Sticky',
    refs: ['inner', 'sentinelRef'],
    components: {
      Sentinel,
    },
    options: {
      zIndex: {
        type: Number,
        default: 100,
      },
      hideWhenUp: Boolean,
      hideWhenDown: Boolean,
    },
  };

  /**
   * Holder for all instances.
   */
  // eslint-disable-next-line no-use-before-define
  static instances: Set<Sticky> = new Set();

  /**
   * Is the component sticky?
   */
  isSticky = false;

  /**
   * Is the component visible?
   */
  isVisible = true;

  /**
   * Set the Y value.
   */
  set y(value: number) {
    this.$refs.inner.style.transform = `translateY(${value}px) translateZ(0px)`;
  }

  /**
   * Get instances as array.
   */
  get instances(): Sticky[] {
    return Array.from(Sticky.instances);
  }

  /**
   * Mounted hook.
   */
  mounted() {
    Sticky.instances.add(this);
    this.setSentinelSize();
  }

  /**
   * Resized hook.
   */
  resized() {
    this.setSentinelSize();
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    Sticky.instances.delete(this);
  }

  /**
   * Scrolled hook.
   */
  scrolled(props) {
    if (!this.isSticky || props.y === props.last.y) {
      return;
    }

    if (
      (props.direction.y === 'DOWN' && this.$options.hideWhenDown) ||
      (props.direction.y === 'UP' && this.$options.hideWhenUp)
    ) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Listen to the sentinel's `intersected` event to set the `isSticky` value.
   * @param   {IntersectionObserverEntry[]} entries
   * @returns {void}
   */
  onSentinelIntersected({ args: [[entry]] }: { args: [IntersectionObserverEntry[]] }) {
    this.isSticky = entry.isIntersecting && entry.boundingClientRect.y < 0;
    this.setPosition();
  }

  /**
   * Hide the sticky component when another one is sticky.
   */
  hide() {
    if (!this.isVisible) {
      return;
    }

    this.isVisible = false;
    this.$el.classList.add('pointer-events-none');

    this.instances.forEach((instance, index) => instance.setPosition(index));
  }

  /**
   * Show the sticky component when the other one is not sticky anymore.
   */
  show() {
    if (this.isVisible) {
      return;
    }

    this.isVisible = true;
    this.$el.classList.remove('pointer-events-none');
    this.instances.forEach((instance, index) => instance.setPosition(index));
  }

  /**
   * Set the sentinel height based on the previous instances.
   */
  setSentinelSize() {
    const { instances } = this;
    const index = instances.indexOf(this);
    const height = instances
      .slice(0, index)
      .filter(
        // Test each instance sticky context against the current element
        (instance) => this.closestRelativeElement(instance.$el).contains(this.$el),
      )
      .reduce((acc, instance) => acc + instance.$el.offsetHeight, 0);

    this.$refs.sentinelRef.style.height = `${height + 1}px`;
    this.$el.style.top = `${height}px`;
    this.$el.style.zIndex = String(this.$options.zIndex - index);
  }

  /**
   * Set the component's position.
   * @param   {number} [index] The instance index in all the pages' instances.
   * @returns {void}
   */
  setPosition(index?: number) {
    if (!this.isSticky) {
      this.y = 0;
      return;
    }

    const { instances } = this;

    // eslint-disable-next-line no-param-reassign
    index = index ?? instances.indexOf(this);

    this.y = instances
      .slice(0, index)
      .filter((instance) => instance.isSticky && !instance.isVisible)
      .reduce<number>(
        (y: number, instance) => y - instance.$refs.inner.offsetHeight,
        this.isVisible ? 0 : this.$refs.inner.offsetHeight * -1,
      ) as number;
  }

  /**
   * Find the first parent which has a relative position.
   */
  closestRelativeElement(element: HTMLElement) {
    let parent = element.parentElement;

    while (getComputedStyle(parent).position !== 'relative' && parent.parentElement) {
      parent = parent.parentElement;
    }

    return parent;
  }
}
