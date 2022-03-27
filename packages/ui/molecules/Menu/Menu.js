import { Base } from '@studiometa/js-toolkit';
import { nextTick } from '@studiometa/js-toolkit/utils';
import MenuBtn from './MenuBtn.js';
import MenuItems from './MenuItems.js';

/**
 * @typedef {Menu & {
 *   $children: {
 *     Menu: Menu[],
 *     MenuBtn: MenuBtn[],
 *     MenuItems: MenuItems[],
 *   }
 * }} MenuInterface
 */

/**
 * Menu class.
 */
export default class Menu extends Base {
  /**
   * Config.
   */
  static config = {
    name: 'Menu',
    debug: true,
    components: {
      MenuBtn,
      MenuItems,
      Menu,
    },
    options: {
      mode: {
        type: String,
        default: 'click', // or 'hover'
      },
    },
  };

  /**
   * Get direct children.
   *
   * @this    {MenuInterface}
   * @param   {string} name
   * @returns {any[]}
   */
  getDirectChildren(name) {
    if (!this.$children[name]) {
      return [];
    }

    if (!this.$children.Menu) {
      return this.$children[name];
    }

    return this.$children[name].filter((child) =>
      this.$children.Menu.every((menu) =>
        menu.$children[name] ? !menu.$children[name].includes(child) : true
      )
    );
  }

  /**
   * Get the first `MenuItems` instance.
   *
   * @this    {MenuInterface}
   * @returns {MenuItems}
   */
  get menuItems() {
    return this.getDirectChildren('MenuItems')[0];
  }

  /**
   * Get the first `MenuBtn` instance.
   *
   * @this    {MenuInterface}
   * @returns {MenuBtn}
   */
  get menuBtn() {
    return this.getDirectChildren('MenuBtn')[0];
  }

  /**
   * @todo test breakpoint to switch between click and hover.
   */
  get shouldReactOnClick() {
    return this.$options.mode === 'click';
  }

  /**
   * Wether the button or the items are hovered.
   *
   * @returns {boolean}
   */
  get isHover() {
    return this.menuBtn.isHover || this.menuItems.isHover;
  }

  /**
   * Set attributes on mounted, destroy the component if it is missing required
   * child components.
   *
   * @returns {void}
   */
  mounted() {
    if (!this.menuBtn || !this.menuItems) {
      this.$destroy();
      return;
    }

    this.menuBtn.$el.setAttribute('aria-controls', this.$id);
    this.menuItems.$el.setAttribute('id', this.$id);
    this.menuItems.close();
  }

  /**
   * Keyboard management.
   *
   * @param   {import('@studiometa/js-toolkit/services/key').KeyServiceProps} options
   * @returns {void}
   */
  keyed({ ENTER, ESC, isUp }) {
    if (!isUp) {
      return;
    }

    if (ESC) {
      this.close();
      return;
    }

    if (!this.shouldReactOnClick) {
      const hasFocusElementWithin = document.activeElement === this.menuBtn.$el;

      if (ENTER && hasFocusElementWithin) {
        this.toggle();
      }
    }
  }

  /**
   * Toggle menu items on button click;
   *
   * @this    {MenuInterface}
   * @param   {MouseEvent} event
   * @returns {void}
   */
  onMenuBtnBtnClick(event, index) {
    if (this.$children.MenuBtn[index] === this.menuBtn && this.shouldReactOnClick) {
      event.preventDefault();
      this.toggle();
    }
  }

  /**
   * Open menu items on button mouse enter.
   *
   * @this    {MenuInterface}
   * @returns {void}
   */
  onMenuBtnBtnMouseenter(event, index) {
    if (this.$children.MenuBtn[index] === this.menuBtn && !this.shouldReactOnClick) {
      this.open();
    }
  }

  /**
   * Close menu items on button mouse leave.
   *
   * @this    {MenuInterface}
   * @returns {void}
   */
  onMenuBtnBtnMouseleave() {
    if (this.shouldReactOnClick) {
      return;
    }

    nextTick(() => {
      if (!this.isHover) {
        this.close();
      }
    });
  }

  /**
   * Close menu items on button mouse leave.
   *
   * @this    {MenuInterface}
   * @returns {void}
   */
  onMenuItemsItemsMouseleave() {
    if (this.shouldReactOnClick) {
      return;
    }

    nextTick(() => {
      if (!this.isHover) {
        this.close();
      }
    });
  }

  /**
   * Close other non-parent menu items on menu items open.
   *
   * @this    {MenuInterface}
   * @param   {number} index
   * @returns {void}
   */
  onMenuItemsItemsOpen(index) {
    const targetMenu = this.$children.MenuItems[index];
    this.$children.MenuItems.forEach((menuItem) => {
      if (!menuItem.$el.contains(targetMenu.$el)) {
        menuItem.close();
      }
    });
  }

  /**
   * Close the menu.
   * @returns {void}
   */
  close() {
    this.menuItems.close();
  }

  /**
   * Open the menu.
   * @returns {void}
   */
  open() {
    this.menuItems.open();
  }

  /**
   * Toggle the menu.
   * @returns {void}
   */
  toggle() {
    this.menuItems.toggle();
  }
}
