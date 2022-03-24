import Transition from '../../primitives/Transition/Transition.js';

const FOCUSABLE_ELEMENTS = [
  'a[href]:not([inert])',
  'area[href]:not([inert])',
  'input:not([disabled]):not([inert])',
  'select:not([disabled]):not([inert])',
  'textarea:not([disabled]):not([inert])',
  'button:not([disabled]):not([inert])',
  'iframe:not([inert])',
  'audio:not([inert])',
  'video:not([inert])',
  '[contenteditable]:not([inert])',
  '[tabindex]:not([inert])',
].join(',');

/**
 * @typedef {MenuItems & {
 *   $children: {
 *     MenuItems: MenuItems[]
 *   }
 * }} MenuItemsInterface
 */

/**
 * MenuItems class.
 */
export default class MenuItems extends Transition {
  /**
   * Config.
   */
  static config = {
    ...Transition.config,
    name: 'MenuItems',
    emits: ['items-open', 'items-close'],
    components: {
      MenuItems,
    },
  };

  /**
   * Are the menu items visible?
   * @type {boolean}
   */
  isOpen = false;

  /**
   * Override `Transition` options.
   */
  get $options() {
    const options = super.$options;

    options.leaveKeep = true;
    options.enterKeep = true;

    options.enterTo = 'is-open';
    options.enterActive = 'transition duration-500 ease-out-expo';
    options.leaveActive = 'transition duration-500 ease-out-expo';
    options.leaveTo = 'transform -translate-x-full pointer-events-none';

    return options;
  }

  /**
   * Update tab indexes on mount.
   *
   * @returns {void}
   */
  mounted() {
    this.__updateTabIndexes('close');
  }

  /**
   * Display the menu items.
   * @returns {void}
   */
  open() {
    if (this.isOpen) {
      return;
    }

    const clickOutsideHandler = (event) => {
      if (!this.$el.contains(event.target)) {
        document.removeEventListener('click', clickOutsideHandler);
        this.close();
      }
    };
    document.addEventListener('click', clickOutsideHandler);

    this.__updateTabIndexes('open');
    this.$el.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    this.enter();
    this.$emit('items-open');
  }

  /**
   * Hide the menu items.
   *
   * @this    {MenuItemsInterface}
   * @returns {void}
   */
  close() {
    if (!this.isOpen) {
      return;
    }

    // Close child menu items.
    this.$children.MenuItems.forEach((menuItem) => {
      menuItem.close();
    });

    this.$el.setAttribute('aria-hidden', 'true');
    this.__updateTabIndexes('close');
    this.isOpen = false;
    this.leave();
    this.$emit('items-close');
  }

  /**
   * Toggle the menu items.
   * @returns {void}
   */
  toggle() {
    console.log(this.$id, 'toggle', this.isOpen);
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Update `tabindex` attribute of child focusable elements.
   *
   * @private
   * @param {'open'|'close'} mode
   * @returns {void}
   */
  __updateTabIndexes(mode = 'open') {
    const focusableItems = Array.from(this.$el.querySelectorAll(FOCUSABLE_ELEMENTS)).filter(
      (item) => this.__filterFocusableItems(/** @type {HTMLElement} */ (item))
    );

    focusableItems.forEach((item) => {
      if (mode === 'close') {
        item.setAttribute('tabindex', '-1');
      } else {
        item.removeAttribute('tabindex');
      }
    });
  }

  /**
   * Filter out items which are inside a child `MenuItems` instance.
   *
   * @private
   * @param   {HTMLElement} item
   * @returns {boolean}
   */
  __filterFocusableItems(item) {
    let ancestor = item.parentElement;

    // @ts-ignore
    while (ancestor && (!ancestor.__base__ || !ancestor.__base__.has(this.constructor))) {
      ancestor = ancestor.parentElement;
    }

    return ancestor === null || ancestor === this.$el;
  }
}
