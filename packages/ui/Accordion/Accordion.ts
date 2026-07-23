import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { AccordionCore } from './AccordionCore.js';
import type { AccordionProps } from './AccordionCore.js';
import { AccordionItem } from './AccordionItem.js';

/**
 * Accordion class.
 *
 * The ready-to-use accordion component. It extends `AccordionCore` with the
 * default `AccordionItem` child implementation, so declaring `data-component="Accordion"`
 * on a container with nested `AccordionItem` elements yields a fully working,
 * optionally auto-closing accordion without any custom item class.
 *
 * @link https://ui.studiometa.dev/components/Accordion/
 */
export class Accordion<T extends BaseProps = BaseProps> extends AccordionCore<T & AccordionProps> {
  static config: BaseConfig = {
    ...AccordionCore.config,
    components: {
      AccordionItem,
    },
  };
}
