import { Base } from '@studiometa/js-toolkit';
import TableOfContentAnchor from './TableOfContentAnchor.js';

/**
 * @typedef {TableOfContent & {
 *   $refs: {
 *     itemTemplate: HTMLTemplateElement,
 *     list: HTMLUListElement
 *   },
 *   $options: {
 *     contentSelector: string,
 *     withTemplate: boolean,
 *   }
 * }} TableOfContentInterface
 */

/**
 * TableOfContent class.
 */
export default class TableOfContent extends Base {
  /**
   * Config.
   */
  static config = {
    name: 'TableOfContent',
    refs: ['itemTemplate', 'list'],
    components: {
      TableOfContentAnchor,
    },
    options: {
      contentSelector: String,
      withTemplate: Boolean,
    },
  };

  /**
   * Generate anchors on mount and update the component to instantiate the
   * `TableOfContentAnchor` components.
   * @returns {void}
   */
  mounted() {
    if (this.$options.withTemplate) {
      this.generateAnchors();
      this.$update();
    }
  }

  /**
   * Generate all anchors.
   *
   * @todo Read anchor template from a ref?
   * @todo Better API to easily override the template function, maybe a `render` function?
   *
   * @this    {TableOfContentInterface}
   * @returns {void}
   */
  generateAnchors() {
    document.querySelectorAll(this.$options.contentSelector).forEach((section) => {
      const tpl = document.createElement('div');
      tpl.innerHTML = this.$refs.itemTemplate.innerHTML;
      const li = tpl.querySelector('li');
      const anchor = li.querySelector('a');
      anchor.href = `#${section.id}`;
      anchor.innerHTML = section.textContent;
      anchor.dataset.component = 'TableOfContentAnchor';
      this.$refs.list.appendChild(li);
    });
  }
}
