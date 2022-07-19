import { Base, isDirectChild, getDirectChildren } from '@studiometa/js-toolkit';
import { nextTick } from '@studiometa/js-toolkit/utils';
import MenuBtn from './MenuBtn.js';
import MenuList from './MenuList.js';

/**
 * @typedef {Menu & {
 *   $children: {
 *     Menu: Menu[],
 *     MenuBtn: MenuBtn[],
 *     MenuList: MenuList[],
 *   },
 *   $options: {
 *     mode: 'click'|'hover'
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
      MenuList,
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
   * Get the first `MenuList` instance.
   *
   * @this    {MenuInterface}
   * @returns {MenuList}
   */
  get menuList() {
    return getDirectChildren(this, 'Menu', 'MenuList')[0];
  }

  /**
   * Get the first `MenuBtn` instance.
   *
   * @this    {MenuInterface}
   * @returns {MenuBtn}
   */
  get menuBtn() {
    return getDirectChildren(this, 'Menu', 'MenuBtn')[0];
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
    return this.menuBtn.isHover || this.menuList.isHover;
  }

  /**
   * Set attributes on mounted, destroy the component if it is missing required
   * child components.
   *
   * @returns {void}
   */
  mounted() {
    if (!this.menuBtn || !this.menuList) {
      this.$destroy();
      return;
    }

    this.menuBtn.$el.setAttribute('aria-controls', this.$id);
    this.menuList.$el.setAttribute('id', this.$id);
    this.menuList.close();
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
   * @param   {number} index
   * @param   {MouseEvent} event
   * @returns {void}
   */
  onMenuBtnClick(index, event) {
    if (
      isDirectChild(this, 'Menu', 'MenuBtn', this.$children.MenuBtn[index]) &&
      this.shouldReactOnClick
    ) {
      event.preventDefault();
      this.toggle();
    }
  }

  /**
   * Open menu items on button mouse enter.
   *
   * @this    {MenuInterface}
   * @param   {number} index
   * @returns {void}
   */
  onMenuBtnMouseenter(index) {
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
  onMenuBtnMouseleave() {
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
  onMenuListMouseleave() {
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
  onMenuListItemsOpen(index) {
    const targetMenu = this.$children.MenuList[index];
    this.$children.MenuList.forEach((menuItem) => {
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
    this.menuList.close();
  }

  /**
   * Open the menu.
   * @returns {void}
   */
  open() {
    this.menuList.open();
  }

  /**
   * Toggle the menu.
   * @returns {void}
   */
  toggle() {
    this.menuList.toggle();
  }
}
