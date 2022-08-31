import type { BaseTypeParameter } from '@studiometa/js-toolkit';
import { AccordionCore } from './AccordionCore.js';
import type { AccordionInterface } from './AccordionCore.js';
import { AccordionItem } from './AccordionItem.js';

/**
 * Accordion class.
 */
export class Accordion<T extends BaseTypeParameter = BaseTypeParameter> extends AccordionCore<T & AccordionInterface> {
  static config = {
    ...AccordionCore.config,
    components: {
      AccordionItem,
    },
  };
}
