import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { transition } from '@studiometa/js-toolkit/utils';

type TabItem = {
  btn: HTMLElement;
  content: HTMLElement;
  isEnabled: boolean;
};

type TabsStates = Partial<
  Record<'open' | 'active' | 'closed', string | Partial<CSSStyleDeclaration>>
>;
// eslint-disable-next-line no-use-before-define
type TabsStylesOption = Partial<Record<keyof TabsProps['$refs'], TabsStates>>;

export interface TabsProps extends BaseProps {
  $options: {
    styles: TabsStylesOption;
  };
  $refs: {
    btn: HTMLElement[];
    content: HTMLElement[];
  };
}

/**
 * Tabs class.
 */
export class Tabs<T extends BaseProps = BaseProps> extends Base<T & TabsProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Tabs',
    refs: ['btn[]', 'content[]'],
    emits: ['enable', 'disable'],
    options: {
      styles: {
        type: Object,
        default: (): TabsStylesOption => ({
          content: {
            closed: {
              position: 'absolute',
              opacity: '0',
              pointerEvents: 'none',
              visibility: 'hidden',
            },
          },
        }),
        merge: true,
      },
    },
  };

  items: TabItem[];

  /**
   * Initialize the component's behaviours.
   * @returns {void}
   */
  mounted() {
    this.items = this.$refs.btn.map((btn, index) => {
      const id = `${this.$id}-${index}`;
      const content = this.$refs.content[index];
      btn.setAttribute('id', id);
      content.setAttribute('aria-labelledby', id);

      const item = { btn, content, isEnabled: index > 0 };
      if (index > 0) {
        this.disableItem(item);
      } else {
        this.enableItem(item);
      }
      return item;
    });
  }

  /**
   * Switch tab on button click.
   */
  onBtnClick(event: MouseEvent, index: number) {
    this.items.forEach((item, i) => {
      if (i !== index) {
        this.disableItem(item);
      }
    });

    this.enableItem(this.items[index]);
  }

  /**
   * Enable the given tab and its associated content.
   */
  async enableItem(item: TabItem): Promise<this> {
    if (!item || item.isEnabled) {
      return Promise.resolve(this);
    }

    item.isEnabled = true;
    const { btn, content } = item;
    const btnStyles = this.$options.styles.btn || {};
    const contentStyles = this.$options.styles.content || {};

    content.setAttribute('aria-hidden', 'false');
    this.$emit('enable', item);

    return Promise.all([
      transition(
        btn,
        {
          from: btnStyles.closed,
          active: btnStyles.active,
          to: btnStyles.open,
        },
        'keep',
      ),
      transition(
        content,
        {
          from: contentStyles.closed,
          active: contentStyles.active,
          to: contentStyles.open,
        },
        'keep',
      ),
    ]).then(() => Promise.resolve(this));
  }

  /**
   * Disable the given tab and its associated content.
   */
  async disableItem(item: TabItem): Promise<this> {
    if (!item || !item.isEnabled) {
      return Promise.resolve(this);
    }

    item.isEnabled = false;
    const { btn, content } = item;
    const btnStyles = this.$options.styles.btn || {};
    const contentStyles = this.$options.styles.content || {};

    content.setAttribute('aria-hidden', 'true');
    this.$emit('disable', item);

    return Promise.all([
      transition(
        btn,
        {
          from: btnStyles.open,
          active: btnStyles.active,
          to: btnStyles.closed,
        },
        'keep',
      ),
      transition(
        content,
        {
          from: contentStyles.open,
          active: contentStyles.active,
          to: contentStyles.closed,
        },
        'keep',
      ),
    ]).then(() => Promise.resolve(this));
  }
}
