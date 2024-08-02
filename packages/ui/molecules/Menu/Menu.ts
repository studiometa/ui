import { Base, isDirectChild, getDirectChildren } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps, KeyServiceProps } from '@studiometa/js-toolkit';
import { nextTick } from '@studiometa/js-toolkit/utils';
import { MenuBtn } from './MenuBtn.js';
import { MenuList } from './MenuList.js';

export interface MenuProps extends BaseProps {
  $children: {
    // eslint-disable-next-line no-use-before-define
    Menu: Menu[];
    MenutBtn: MenuBtn[];
    MenuList: MenuList[];
  };
  $options: {
    mode: 'click' | 'hover';
  };
}

/**
 * Menu class.
 */
export class Menu<T extends BaseProps = BaseProps> extends Base<T & MenuProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Menu',
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
   */
  get menuList(): MenuList {
    return getDirectChildren<MenuList>(this, 'Menu', 'MenuList')[0];
  }

  /**
   * Get the first `MenuBtn` instance.
   */
  get menuBtn(): MenuBtn {
    return getDirectChildren<MenuBtn>(this, 'Menu', 'MenuBtn')[0];
  }

  /**
   * Test which mode to use.
   */
  get shouldReactOnClick(): boolean {
    return this.$options.mode === 'click';
  }

  /**
   * Wether the button or the items are hovered.
   */
  get isHover(): boolean {
    return this.menuBtn.isHover || this.menuList.isHover;
  }

  /**
   * Set attributes on mounted, destroy the component if it is missing required
   * child components.
   */
  mounted() {
    if (!this.menuBtn || !this.menuList) {
      return this.$destroy();
    }

    this.menuBtn.$el.setAttribute('aria-controls', this.$id);
    this.menuList.$el.setAttribute('id', this.$id);
    this.menuList.close();
  }

  /**
   * Keyboard management.
   */
  keyed({ ENTER, ESC, isUp }: KeyServiceProps) {
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
   * Toggle menu items on button click.
   */
  onMenuBtnClick({ event, target }: { event: MouseEvent; target: MenuBtn }) {
    if (isDirectChild(this, 'Menu', 'MenuBtn', target) && this.shouldReactOnClick) {
      event.preventDefault();
      this.toggle();
    }
  }

  /**
   * Open menu items on button mouse enter.
   */
  onMenuBtnMouseenter({ target }: { target: MenuBtn }) {
    if (target === this.menuBtn && !this.shouldReactOnClick) {
      this.open();
    }
  }

  /**
   * Close menu items on button mouse leave.
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
   */
  onMenuListItemsOpen({ target }: { target: MenuList }) {
    this.$children.MenuList.forEach((menuItem) => {
      if (!menuItem.$el.contains(target.$el)) {
        menuItem.close();
      }
    });
  }

  /**
   * Close the menu.
   */
  close() {
    this.menuList.close();
  }

  /**
   * Open the menu.
   */
  open() {
    this.menuList.open();
  }

  /**
   * Toggle the menu.
   */
  toggle() {
    this.menuList.toggle();
  }
}
