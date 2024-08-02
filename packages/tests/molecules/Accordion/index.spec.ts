import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Accordion, AccordionItem } from '@studiometa/ui';
import { getInstanceFromElement } from '@studiometa/js-toolkit';
import { h, wait } from '#test-utils';

async function getContext() {
  const root = h('div');
  root.innerHTML = `<section data-component="Accordion" data-option-item='{ "isOpen": false, "styles": { "test": true } }'>
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
  </section>`;

  const instance = new Accordion(root.firstElementChild as HTMLElement);

  vi.useFakeTimers();
  instance.$mount();
  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();

  const btn = Array.from(root.querySelectorAll('[data-ref="btn"]')) as HTMLButtonElement[];
  const content = Array.from(root.querySelectorAll('[data-ref="content"]'));

  return {
    root,
    instance,
    btn,
    content,
  };
}

describe('Accordion component', () => {
  it('should merge parent options with item option', async () => {
    const { root } = await getContext();
    const accordionItem = root.querySelector('[data-component="AccordionItem"]');
    const options = getInstanceFromElement(accordionItem, AccordionItem).$options;
    expect(options.styles).toMatchObject({ test: true });
    expect(options.isOpen).toBe(false);
    options.isOpen = true;
    options.styles.test = false;
    expect(options.styles).toMatchObject({ test: false });
    expect(options.isOpen).toBe(true);
  });

  it('should not autoclose items by default', async () => {
    const { btn, content } = await getContext();
    btn[0].click();
    expect(content[0].getAttribute('aria-hidden')).toBe('false');
    expect(content[1].getAttribute('aria-hidden')).toBe('true');
    btn[1].click();
    expect(content[0].getAttribute('aria-hidden')).toBe('false');
    expect(content[1].getAttribute('aria-hidden')).toBe('false');
  });

  it('should autoclose items when specified', async () => {
    const { instance, btn, content } = await getContext();
    instance.$el.setAttribute('data-option-autoclose', '');
    btn[0].click();

    expect(content[0].getAttribute('aria-hidden')).toBe('false');
    expect(content[1].getAttribute('aria-hidden')).toBe('true');

    btn[1].click();

    expect(content[1].getAttribute('aria-hidden')).toBe('false');
    await wait(500);
    expect(content[0].getAttribute('aria-hidden')).toBe('true');
  });
});
