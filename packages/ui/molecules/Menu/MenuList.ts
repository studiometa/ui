import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { Transition } from '../../primitives/index.js';

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

export interface MenuListProps extends BaseProps {
  $children: {
    // eslint-disable-next-line no-use-before-define
    MenuList: MenuList[];
  };
}

/**
 * MenuList class.
 */
export class MenuList<T extends BaseProps = BaseProps> extends Transition<T & MenuListProps> {
  /**
   * Config.
   */
  static config:BaseConfig = {
    ...Transition.config,
    name: 'MenuList',
    emits: ['items-open', 'items-close', 'items-mouseleave'],
    components: {
      MenuList,
    },
  };

  /**
   * Are the menu items visible?
   */
  isOpen = false;

  /**
   * Wether the component is hovered.
   */
  isHover = false;

  /**
   * Override `Transition` options.
   */
  // @ts-ignore
  get $options() {
    const options = super.$options;

    options.leaveKeep = true;
    options.enterKeep = true;

    return options;
  }

  /**
   * Update tab indexes on mount.
   */
  mounted() {
    this.__updateTabIndexes('close');
  }

  /**
   * Set hover state.
   */
  onMouseenter() {
    this.isHover = true;
  }

  /**
   * Unset hover state.
   */
  onMouseleave() {
    this.isHover = false;
  }

  /**
   * Display the menu items.
   */
  open() {
    if (this.isOpen) {
      return;
    }

    // @todo Remove event listener when the close method is called.
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
   */
  close() {
    if (!this.isOpen) {
      return;
    }

    // Close child menu items.
    this.$children.MenuList.forEach((menuItem) => {
      menuItem.close();
    });

    if (
      document.activeElement instanceof HTMLElement &&
      this.$el.contains(document.activeElement)
    ) {
      document.activeElement.blur();
    }

    this.$el.setAttribute('aria-hidden', 'true');
    this.__updateTabIndexes('close');
    this.isOpen = false;
    this.leave();
    this.$emit('items-close');
  }

  /**
   * Toggle the menu items.
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Update `tabindex` attribute of child focusable elements.
   * @private
   */
  __updateTabIndexes(mode:'open'|'close' = 'open') {
    const focusableItems = Array.from(this.$el.querySelectorAll(FOCUSABLE_ELEMENTS)).filter(
      (item) => this.__filterFocusableItems(item as HTMLElement),
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
   * Filter out items which are inside a child `MenuList` instance.
   * @private
   */
  __filterFocusableItems(item:HTMLElement):boolean {
    let ancestor = item.parentElement;

    // @ts-ignore
    while (ancestor && (!ancestor.__base__ || !ancestor.__base__.has(this.constructor))) {
      ancestor = ancestor.parentElement;
    }

    return ancestor === null || ancestor === this.$el;
  }
}
