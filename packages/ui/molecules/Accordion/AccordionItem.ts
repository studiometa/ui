import deepmerge from 'deepmerge';
import { Base, BaseConfig } from '@studiometa/js-toolkit';
import type { BaseProps } from '@studiometa/js-toolkit';
import { transition } from '@studiometa/js-toolkit/utils';
import { AccordionCore as Accordion } from './AccordionCore.js';

type AccordionItemStates = Partial<
  Record<'open' | 'active' | 'closed', string | Partial<CSSStyleDeclaration>>
>;

export interface AccordionItemProps extends BaseProps {
  $refs: {
    btn: HTMLElement;
    content: HTMLElement;
    container: HTMLElement;
  };
  $options: {
    isOpen: boolean;
    styles: Partial<Record<keyof AccordionItemProps['$refs'], AccordionItemStates>>;
  };
}

/**
 * AccordionItem class.
 */
export class AccordionItem<T extends BaseProps = BaseProps> extends Base<
  T & AccordionItemProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AccordionItem',
    refs: ['btn', 'content', 'container'],
    emits: ['open', 'close'],
    options: {
      isOpen: Boolean,
      styles: {
        type: Object,
        default: (): AccordionItemProps['$options']['styles'] => ({
          container: {
            open: '',
            active: '',
            closed: '',
          },
        }),
        merge: true,
      },
    },
  };

  /**
   * Add aria-attributes on mounted.
   */
  mounted() {
    if (this.$parent && this.$parent instanceof Accordion && this.$parent.$options.item) {
      Object.entries(this.$parent.$options.item).forEach(([key, value]) => {
        if (key in this.$options) {
          // @ts-ignore
          const type = AccordionItem.config.options[key].type ?? AccordionItem.config.options[key];
          if (type === Array || type === Object) {
            // @ts-ignore
            this.$options[key] = deepmerge(this.$options[key], /** @type {any} */ value);
          } else {
            // @ts-ignore
            this.$options[key] = value;
          }
        }
      });
    }

    this.$refs.btn.setAttribute('id', this.$id);
    this.$refs.btn.setAttribute('aria-controls', this.contentId);
    this.$refs.content.setAttribute('aria-labelledby', this.$id);
    this.$refs.content.setAttribute('id', this.contentId);

    const { isOpen } = this.$options;
    this.updateAttributes(isOpen);

    // Update refs styles on mount
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { container, ...otherStyles } = this.$options.styles;

    const { $refs } = this;
    Object.entries(otherStyles)
      .filter(([refName]) => $refs[refName])
      .forEach(([refName, { open, closed } = { open: '', closed: '' }]) => {
        transition($refs[refName] as HTMLElement, { to: isOpen ? open : closed }, 'keep');
      });
  }

  /**
   * Remove styles on destroy.
   */
  destroyed() {
    this.$refs.container.style.visibility = '';
    this.$refs.container.style.height = '';
  }

  /**
   * Handler for the click event on the `btn` ref.
   */
  onBtnClick() {
    if (this.$options.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Get the content ID.
   */
  get contentId():string {
    return `content-${this.$id}`;
  }

  /**
   * Update the refs' attributes according to the given type.
   */
  updateAttributes(isOpen:boolean) {
    this.$refs.container.style.visibility = isOpen ? '' : 'invisible';
    this.$refs.container.style.height = isOpen ? '' : '0';
    this.$refs.content.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    this.$refs.btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  /**
   * Open an item.
   */
  async open() {
    if (this.$options.isOpen) {
      return;
    }

    this.$log('open');
    this.$emit('open');

    this.$options.isOpen = true;
    this.updateAttributes(this.$options.isOpen);

    this.$refs.container.style.visibility = '';
    const { container, ...otherStyles } = this.$options.styles;

    const { $refs } = this;

    await Promise.all([
      transition($refs.container, {
        from: { height: '0' },
        active: container.active,
        to: { height: `${$refs.content.offsetHeight}px` },
      }).then(() => {
        // Remove style only if the item has not been closed before the end
        if (this.$options.isOpen) {
          $refs.content.style.position = '';
        }

        return Promise.resolve();
      }),
      ...Object.entries(otherStyles)
        .filter(([refName]) => $refs[refName])
        .map(([refName, { open, active, closed } = { open: '', active: '', closed: '' }]) =>
          transition(
            $refs[refName] as HTMLElement,
            {
              from: closed,
              active,
              to: open,
            },
            'keep',
          ),
        ),
    ]);
  }

  /**
   * Close an item.
   */
  async close() {
    if (!this.$options.isOpen) {
      return;
    }

    this.$log('close');
    this.$emit('close');

    this.$options.isOpen = false;

    const height = this.$refs.container.offsetHeight;
    this.$refs.content.style.position = 'absolute';
    const { container, ...otherStyles } = this.$options.styles;

    /** @type {AccordionItemRefs} */
    const refs = this.$refs;

    await Promise.all([
      transition(refs.container, {
        from: { height: `${height}px` },
        active: container.active,
        to: { height: '0' },
      }).then(() => {
        // Add end styles only if the item has not been re-opened before the end
        if (!this.$options.isOpen) {
          refs.container.style.height = '0';
          refs.container.style.visibility = 'invisible';
          this.updateAttributes(this.$options.isOpen);
        }
        return Promise.resolve();
      }),
      ...Object.entries(otherStyles)
        .filter(([refName]) => refs[refName])
        .map(([refName, { open, active, closed } = { open: '', active: '', closed: '' }]) =>
          transition(
            refs[refName] as HTMLElement,
            {
              from: open,
              active,
              to: closed,
            },
            'keep',
          ),
        ),
    ]);
  }
}
