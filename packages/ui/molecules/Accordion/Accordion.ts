import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { AccordionCore } from './AccordionCore.js';
import type { AccordionProps } from './AccordionCore.js';
import { AccordionItem } from './AccordionItem.js';

/**
 * Accordion class.
 */
export class Accordion<T extends BaseProps = BaseProps> extends AccordionCore<T & AccordionProps> {
  static config: BaseConfig = {
    ...AccordionCore.config,
    components: {
      AccordionItem,
    },
  };
}
