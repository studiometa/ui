import { Base } from '@studiometa/js-toolkit';
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
      type: {
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
    return this.$options.type === 'click';
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
   * @todo Implement keyboard management.
   *
   * - ESC = close
   *
   * shouldReactOnClick
   * - focus on link + ENTER = toggle
   *
   * !shouldReactOnClick
   * - focus on link = open
   * - focus out link = close
   *
   * @param   {import('@studiometa/js-toolkit/services/key').KeyServiceProps} options
   * @returns {void}
   */
  // keyed({ TAB, ESC, ENTER }) {
  //   const hasFocusElementWithin = this.$el.contains(document.activeElement);

  //   if (ESC) {
  //     this.close();
  //     if (hasFocusElementWithin) {
  //       document.activeElement.blur();
  //     }
  //   }

  //   if (this.$parent.shouldReactOnClick) {
  //     if (ENTER && hasFocusElementWithin) {
  //       this.open();
  //     } else if (ENTER && !hasFocusElementWithin) {
  //       this.close();
  //     }
  //   } else {
  //     if (TAB && hasFocusElementWithin) {
  //       this.open();
  //     } else if (TAB && !hasFocusElementWithin) {
  //       this.close();
  //     }
  //   }
  // }

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
      this.menuItems.toggle();
    }
  }

  /**
   * Open menu items on button mouse enter.
   *
   * @returns {void}
   */
  onMenuBtnBtnMouseenter() {
    if (!this.shouldReactOnClick) {
      this.menuItems.open();
    }
  }

  /**
   * Close menu items on button mouse leave.
   *
   * @returns {void}
   */
  onMenuBtnBtnMouseleave() {
    if (!this.shouldReactOnClick) {
      this.menuItems.close();
    }
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
}