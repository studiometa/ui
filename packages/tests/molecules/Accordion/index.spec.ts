import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Accordion, AccordionItem } from '@studiometa/ui';
import { wait } from '#test-utils';

describe('Accordion component', () => {
  it('should have at least 1 test', () => {
    expect(true).toBe(true);
  });

  let item;
  let btn;
  let content;

  beforeEach(() => {
    document.body.innerHTML = `
       <section data-component="Accordion" data-option-item='{ "isOpen": false, "styles": { "test": true } }'>
         <div data-component="AccordionItem">
           <button data-ref="btn">
             Button
           </button>
           <div data-ref="container" aria-hidden="true">
             <div data-ref="content">
               Content #1
             </div>
           </div>
         </div>
         <div data-component="AccordionItem">
           <button data-ref="btn">
             Button
           </button>
           <div data-ref="container" aria-hidden="true">
             <div data-ref="content">
               Content #2
             </div>
           </div>
         </div>
       </section>
     `;

    item = new Accordion(document.body.firstElementChild).$mount();
    btn = Array.from(document.querySelectorAll('[data-ref="btn"]'));
    content = Array.from(document.querySelectorAll('[data-ref="content"]'));
  });

  it('should merge parent options with item option', () => {
    const accordionItem = document.querySelector('[data-component="AccordionItem"]');
    const options = accordionItem.__base__.get(AccordionItem).$options;
    expect(options.styles).toMatchObject({ test: true });
    expect(options.isOpen).toBe(false);
    options.isOpen = true;
    options.styles.test = false;
    expect(options.styles).toMatchObject({ test: false });
    expect(options.isOpen).toBe(true);
  });

  it('should not autoclose items by default', () => {
    btn[0].click();
    expect(content[0].getAttribute('aria-hidden')).toBe('false');
    expect(content[1].getAttribute('aria-hidden')).toBe('true');
    btn[1].click();
    expect(content[0].getAttribute('aria-hidden')).toBe('false');
    expect(content[1].getAttribute('aria-hidden')).toBe('false');
  });

  it('should autoclose items when specified', async () => {
    item.$el.setAttribute('data-option-autoclose', '');
    btn[0].click();

    expect(content[0].getAttribute('aria-hidden')).toBe('false');
    expect(content[1].getAttribute('aria-hidden')).toBe('true');

    btn[1].click();

    expect(content[1].getAttribute('aria-hidden')).toBe('false');
    await wait(500);
    expect(content[0].getAttribute('aria-hidden')).toBe('true');
  });
});
