import { describe, it, expect, vi } from 'vitest';
import { AccordionItem } from '@studiometa/ui';
import { h, wait } from '#test-utils';

async function getContext() {
  const consoleSpy = vi.spyOn(console, 'warn');
  consoleSpy.mockImplementation(() => true);

  class AccordionItemWithIcon extends AccordionItem {
    static config = {
      ...AccordionItem.config,
      refs: [...AccordionItem.config.refs, 'icon'],
    };
  }

  const root = h('div');
  root.innerHTML = `
    <div
      data-component="AccordionItem"
      data-option-styles='{
        "icon": {
          "open": "transform rotate-180",
          "active": { "transition": "all 1s linear" },
          "closed": "transform rotate-0"
        }
      }'>
      <button data-ref="btn">
        Button
        <span data-ref="icon">▼</span>
      </button>
      <div data-ref="container">
        <div data-ref="content">Content</div>
      </div>
    </div>;
        `;
  const item = new AccordionItemWithIcon(root.firstElementChild as HTMLElement);
  const btn = root.querySelector('[data-ref="btn"]') as HTMLButtonElement;
  const content = root.querySelector('[data-ref="content"]');
  const icon = root.querySelector('[data-ref="icon"]');

  vi.useFakeTimers();
  item.$mount();
  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();

  return {
    root,
    item,
    btn,
    content,
    icon,
    consoleSpy,
    consoleSpyRestor: () => consoleSpy.mockRestore(),
  };
}

describe('AccordionItem component', () => {
  it('should had aria-attributes when mounted', async () => {
    const { btn, content, item } = await getContext();
    expect(btn.id).toBe(item.$id);
    expect(content.getAttribute('aria-labelledby')).toBe(item.$id);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(content.getAttribute('aria-hidden')).toBe('true');
  });

  it('should open and close', async () => {
    const { btn, content, item, icon } = await getContext();
    const spy = vi.spyOn(icon.classList, 'add');
    await item.open();
    expect(content.getAttribute('aria-hidden')).toBe('false');
    expect(spy).toHaveBeenLastCalledWith('transform', 'rotate-180');
    await item.close();
    expect(content.getAttribute('aria-hidden')).toBe('true');
    expect(spy).toHaveBeenLastCalledWith('transform', 'rotate-0');
    btn.click();
    await wait(200);
    expect(content.getAttribute('aria-hidden')).toBe('false');
    btn.click();
    await wait(200);
    expect(content.getAttribute('aria-hidden')).toBe('true');

    item.open();
    item.close();
    expect(spy).toHaveBeenLastCalledWith('transform', 'rotate-180');
    await item.open();
    item.close();
    item.open();
    expect(spy).toHaveBeenLastCalledWith('transform', 'rotate-0');
  });

  it('should emit open and close events', async () => {
    const { item } = await getContext();
    const fn = vi.fn();
    item.$on('open', fn);
    item.$on('close', fn);
    await item.open();
    expect(fn).toHaveBeenCalledTimes(1);
    await item.close();
    expect(fn).toHaveBeenCalledTimes(2);
    await item.close();
    expect(fn).toHaveBeenCalledTimes(2);
    await item.open();
    expect(fn).toHaveBeenCalledTimes(3);
    await item.open();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should remove styles when destroyed', async () => {
    const { item } = await getContext();
    vi.useFakeTimers();
    item.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();
    expect(item.$refs.container.style.visibility).toBe('');
    expect(item.$refs.container.style.height).toBe('');
  });
});
