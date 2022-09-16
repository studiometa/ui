import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { AccordionItem, AccordionItemProps } from './AccordionItem';

export interface AccordionProps extends BaseProps {
  $refs: {
    btn: HTMLElement[];
    content: HTMLElement[];
  };
  $options: {
    autoclose: boolean;
    item: AccordionItemProps['$options'];
  };
  $children: {
    AccordionItem: AccordionItem[];
  };
}

/**
 * Accordion class.
 */
export class AccordionCore<T extends BaseProps = BaseProps> extends Base<
  T & AccordionProps
> {
  /**
   * Accordion config.
   */
  static config: BaseConfig = {
    name: 'Accordion',
    emits: ['open', 'close'],
    options: {
      autoclose: Boolean,
      item: {
        type: Object,
        default: (): Partial<AccordionItemProps['$options']> => ({}),
      },
    },
  };

  /**
   * Synchronize close on open.
   */
  onAccordionItemOpen(index: number) {
    this.$emit('open', this.$children.AccordionItem[index], index);
    if (this.$options.autoclose) {
      this.$children.AccordionItem.filter((el, i) => index !== i).forEach((item) => item.close());
    }
  }

  /**
   * Emit close event.
   */
  onAccordionItemClose(index: number) {
    this.$emit('close', this.$children.AccordionItem[index], index);
  }
}
