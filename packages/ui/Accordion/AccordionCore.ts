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
 *
 * The base orchestrator for a group of `AccordionItem` children. It relays each
 * item's open/close into the `open` and `close` events and, when the `autoclose`
 * option (`data-option-autoclose`) is set, closes every other item as soon as
 * one opens. The `item` option is forwarded to each child so item defaults can be
 * configured from the parent. It carries no child component itself and is meant
 * to be extended (see `Accordion`).
 */
export class AccordionCore<T extends BaseProps = BaseProps> extends Base<T & AccordionProps> {
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
  onAccordionItemOpen({ index }: { index: number }) {
    this.$emit('open', this.$children.AccordionItem[index], index);
    if (this.$options.autoclose) {
      this.$children.AccordionItem.filter((el, i) => index !== i).forEach((item) => item.close());
    }
  }

  /**
   * Emit close event.
   */
  onAccordionItemClose({ index }: { index: number }) {
    this.$emit('close', this.$children.AccordionItem[index], index);
  }
}
