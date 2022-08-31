import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseTypeParameter } from '@studiometa/js-toolkit';
import type { AccordionItem, AccordionItemInterface } from './AccordionItem';

export interface AccordionInterface extends BaseTypeParameter {
  $refs: {
    btn: HTMLElement[];
    content: HTMLElement[];
  };
  $options: {
    autoclose: boolean;
    item: AccordionItemInterface['$options'];
  };
  $children: {
    AccordionItem: AccordionItem[];
  };
}

/**
 * Accordion class.
 */
export class AccordionCore<T extends BaseTypeParameter = BaseTypeParameter> extends Base<
  T & AccordionInterface
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
        default: (): Partial<AccordionItemInterface['$options']> => ({}),
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
