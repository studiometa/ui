import { Base } from '@studiometa/js-toolkit';
import { Sentinel } from '../../primitives/index.js';

/**
 * @typedef {Object} StickyRefs
 * @property {HTMLElement} inner
 * @property {HTMLElement} sentinelRef
 */

/**
 * @typedef {Object} StickyPrivateInterface
 * @property {StickyRefs} $refs
 * @property {{ zIndex: number, hideWhenUp: boolean, hideWhenDown: boolean }} $options
 * @property {{ Sentinel: Sentinel[] }} $children
 */

/**
 * @typedef {Sticky & StickyPrivateInterface} StickyInterface
 */

/**
 * Sticky class.
 */
export default class Sticky extends Base {
  /**
   * Config.
   */
  static config = {
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
   * @type {Set<StickyInterface>}
   */
  static instances = new Set();

  /**
   * Is the component sticky?
   * @type {boolean}
   */
  isSticky = false;

  /**
   * Is the component visible?
   * @type {Boolean}
   */
  isVisible = true;

  /**
   * Set the Y value.
   *
   * @this    {StickyInterface}
   * @param   {number} value
   * @returns {void}
   */
  set y(value) {
    this.$refs.inner.style.transform = `translateY(${value}px) translateZ(0px)`;
  }

  /**
   * Get instances as array.
   * @return {Array<StickyInterface>}
   */
  get instances() {
    return Array.from(Sticky.instances);
  }

  /**
   * Mounted hook.
   * @this {StickyInterface}
   */
  mounted() {
    Sticky.instances.add(this);
    this.setSentinelSize();
  }

  /**
   * Resized hook.
   * @this {StickyInterface}
   * @returns {void}
   */
  resized() {
    this.setSentinelSize();
  }

  /**
   * Destroyed hook.
   * @this {StickyInterface}
   */
  destroyed() {
    Sticky.instances.delete(this);
  }

  /**
   * Scrolled hook.
   * @this {StickyInterface}
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
   * Listen to the sentinel's `sticky-change` event to set the `isSticky` value.
   *
   * @param   {boolean} isSticky
   * @returns {void}
   */
  onSentinelStickyChange(isSticky) {
    this.isSticky = isSticky;
    this.setPosition();
  }

  /**
   * Hide the sticky component when another one is sticky.
   * @this {StickyInterface}
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
   * @this {StickyInterface}
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
   * @this {StickyInterface}
   */
  setSentinelSize() {
    const { instances } = this;
    const index = instances.findIndex((instance) => instance === this);
    const height = instances
      .slice(0, index)
      .filter(
        // Test each instance sticky context against the current element
        (instance) => this.closestRelativeElement(instance.$el).contains(this.$el)
      )
      .reduce((acc, instance) => acc + instance.$el.offsetHeight, 0);

    this.$refs.sentinelRef.style.height = `${height + 1}px`;
    this.$el.style.top = `${height}px`;
    this.$el.style.zIndex = String(this.$options.zIndex - index);
  }

  /**
   * Set the component's position.
   *
   * @this    {StickyInterface}
   * @param   {number} [index] The instance index in all the pages' instances.
   * @returns {void}
   */
  setPosition(index) {
    if (!this.isSticky) {
      this.y = 0;
      return;
    }

    const { instances } = this;

    // eslint-disable-next-line no-param-reassign
    index = index ?? instances.findIndex((instance) => instance === this);

    this.y = instances
      .slice(0, index)
      .filter((instance) => instance.isSticky && !instance.isVisible)
      .reduce(
        (y, instance) => {
          return y - instance.$refs.inner.offsetHeight;
        },
        this.isVisible ? 0 : this.$refs.inner.offsetHeight * -1
      );
  }

  /**
   * Find the first parent which has a relative position.
   *
   * @param   {HTMLElement} element
   * @returns {HTMLElement}
   */
  closestRelativeElement(element) {
    let parent = element.parentElement;

    while (getComputedStyle(parent).position !== 'relative' && parent.parentElement) {
      parent = parent.parentElement;
    }

    return parent;
  }
}
