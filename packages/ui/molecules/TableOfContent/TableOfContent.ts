import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { TableOfContentAnchor } from './TableOfContentAnchor.js';

export interface TableOfContentProps extends BaseProps {
  $refs: {
    itemTemplate: HTMLTemplateElement;
    list: HTMLUListElement;
  };
  $options: {
    contentSelector: string;
    withTemplate: boolean;
  };
  $children: {
    TableOfContentAnchor: TableOfContentAnchor[];
  };
}

/**
 * TableOfContent class.
 */
export class TableOfContent<T extends BaseProps = BaseProps> extends Base<T & TableOfContentProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
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
      this.$refs.list.append(li);
    });
  }
}
