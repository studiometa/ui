import AccordionCore from './AccordionCore.js';
import AccordionItem from './AccordionItem.js';

/**
 * @typedef {import('./AccordionCore.js').AccordionInterface} AccordionInterface
 * @typedef {import('./AccordionItem.js').AccordionItemInterface} AccordionItemInterface
 */

/**
 * Accordion class.
 */
export default class Accordion extends AccordionCore {
  static config = {
    ...AccordionCore.config,
    components: {
      AccordionItem,
    },
  };
}
