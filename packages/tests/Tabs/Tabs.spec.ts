import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, mount, resetDom, waitFor } from '@studiometa/js-toolkit/test';
import { Tabs } from '#private/Tabs/Tabs.js';
import { Transition } from '#private/Transition/Transition.js';

registerComponents(Tabs, Transition);

afterEach(resetDom);

interface TabsOptions {
  /** Extra attributes on the root element, e.g. `data-option-activation="manual"`. */
  attributes?: string;
  /** Extra attributes on the `list` ref, e.g. `aria-orientation="vertical"`. */
  listAttributes?: string;
  /** Give one panel a `Transition` child. */
  transitionOn?: number;
  /** Which tab the markup says is selected. */
  selected?: number;
  /** Drop the `aria-label` naming the tab list. */
  unnamed?: boolean;
  /** Drop the `list` ref entirely. */
  withoutList?: boolean;
}

function tabsHtml({
  attributes = '',
  listAttributes = '',
  transitionOn = -1,
  selected = 0,
  unnamed = false,
  withoutList = false,
}: TabsOptions = {}): string {
  const indexes = [0, 1, 2];
  const buttons = indexes
    .map(
      (index) =>
        `<button data-ref="btn[]" aria-selected="${index === selected}">Tab ${index}</button>`,
    )
    .join('');
  const panels = indexes
    .map(
      (index) =>
        `<div data-ref="content[]"${index === selected ? '' : ' hidden'}>Panel ${index}${
          index === transitionOn
            ? '<div data-component="Transition" data-option-enter-from="opacity-0" data-option-enter-to="opacity-100" data-option-leave-to="opacity-0"></div>'
            : ''
        }</div>`,
    )
    .join('');
  const list = withoutList
    ? buttons
    : `<div data-ref="list"${unnamed ? '' : ' aria-label="Sections"'}${listAttributes ? ` ${listAttributes}` : ''}>${buttons}</div>`;

  return `<div data-component="Tabs"${attributes ? ` ${attributes}` : ''}>${list}${panels}</div>`;
}

async function render(options: TabsOptions = {}): Promise<Tabs> {
  const root = await mount(tabsHtml(options));
  return getInstance<Tabs>(root.firstElementChild as HTMLElement, 'Tabs')!;
}

describe('The Tabs component', () => {
  it('emits `tabs-enable` and `tabs-disable` with the tab, its panel and its index.', async () => {
    const tabs = await render();
    const enabled = vi.fn();
    const disabled = vi.fn();
    tabs.$on('tabs-enable', enabled);
    tabs.$on('tabs-disable', disabled);

    await tabs.goTo(1);
    expect(enabled).toHaveBeenCalledTimes(1);
    expect(disabled).toHaveBeenCalledTimes(1);

    await tabs.goTo(0);
    expect(enabled).toHaveBeenCalledTimes(2);
    // v1 emitted the positional `TabItem`, read back as `detail[0]`. v4's
    // `$emit()` takes one payload object, and the mutable `isEnabled` flag the
    // item carried is the name of the event now.
    expect(enabled.mock.calls[1][0].detail).toEqual({
      index: 0,
      btn: tabs.$refs.btn[0],
      content: tabs.$refs.content[0],
    });
    expect(disabled.mock.calls[1][0].detail).toEqual({
      index: 1,
      btn: tabs.$refs.btn[1],
      content: tabs.$refs.content[1],
    });
  });

  it('wires the tablist, tab and tabpanel roles and their relationships.', async () => {
    const tabs = await render();
    const { list, btn, content } = tabs.$refs;

    expect(list.getAttribute('role')).toBe('tablist');

    for (const [index, tab] of btn.entries()) {
      const panel = content[index];
      expect(tab.getAttribute('role')).toBe('tab');
      expect(panel.getAttribute('role')).toBe('tabpanel');
      expect(tab.id).not.toBe('');
      expect(panel.id).not.toBe('');
      expect(tab.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
      expect(panel.tabIndex).toBe(0);
    }
  });

  it('moves `aria-selected`, `hidden` and the roving tabindex on activation.', async () => {
    const tabs = await render();
    const { btn, content } = tabs.$refs;

    expect(btn.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(btn.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
    expect(content.map((panel) => panel.hidden)).toEqual([false, true, true]);

    btn[1].click();

    // v1 asserted `aria-hidden` on the panels. `hidden` both hides the panel
    // and removes it from the accessibility tree and the tab order, which is
    // what the pattern asks for; `aria-hidden` beside it would be redundant
    // and is not written any more.
    expect(btn.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    expect(btn.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1]);
    expect(content.map((panel) => panel.hidden)).toEqual([true, false, true]);
    expect(content.some((panel) => panel.hasAttribute('aria-hidden'))).toBe(false);
  });

  it('starts on the tab the markup marks selected.', async () => {
    const tabs = await render({ selected: 2 });
    expect(tabs.currentIndex).toBe(2);
    expect(tabs.$refs.content.map((panel) => panel.hidden)).toEqual([true, true, false]);
  });

  it('moves the focus with the arrow keys, wrapping at both ends.', async () => {
    const tabs = await render();
    const { btn } = tabs.$refs;
    btn[0].focus();

    press(btn[0], 'ArrowRight');
    expect(document.activeElement).toBe(btn[1]);
    expect(tabs.currentIndex).toBe(1);

    press(btn[1], 'ArrowRight');
    press(btn[2], 'ArrowRight');
    expect(document.activeElement).toBe(btn[0]);
    expect(tabs.currentIndex).toBe(0);

    press(btn[0], 'ArrowLeft');
    expect(document.activeElement).toBe(btn[2]);
    expect(tabs.currentIndex).toBe(2);
  });

  it('jumps to the first and last tab with Home and End.', async () => {
    const tabs = await render();
    const { btn } = tabs.$refs;

    press(btn[0], 'End');
    expect(tabs.currentIndex).toBe(2);
    press(btn[2], 'Home');
    expect(tabs.currentIndex).toBe(0);
  });

  it('follows `aria-orientation` for which arrows navigate.', async () => {
    const tabs = await render({ listAttributes: 'aria-orientation="vertical"' });
    const { btn } = tabs.$refs;

    expect(tabs.orientation).toBe('vertical');

    const horizontal = press(btn[0], 'ArrowRight');
    expect(tabs.currentIndex).toBe(0);
    expect(horizontal.defaultPrevented).toBe(false);

    press(btn[0], 'ArrowDown');
    expect(tabs.currentIndex).toBe(1);
  });

  it('moves the focus without selecting under manual activation.', async () => {
    const tabs = await render({ attributes: 'data-option-activation="manual"' });
    const { btn } = tabs.$refs;
    btn[0].focus();

    press(btn[0], 'ArrowRight');
    expect(document.activeElement).toBe(btn[1]);
    expect(tabs.currentIndex).toBe(0);
    // The roving tabindex follows the focus, so tabbing back returns where the
    // user left off even though the selection has not moved.
    expect(btn.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1]);

    btn[1].click();
    expect(tabs.currentIndex).toBe(1);
  });

  it('runs a panel’s transitions instead of the removed `styles` option.', async () => {
    const tabs = await render({ transitionOn: 1 });
    const [transition] = tabs.$query<Transition>('Transition');

    const done = tabs.goTo(1);
    await waitFor(() => transition.$el.classList.contains('opacity-100'));
    await done;
    expect(tabs.$refs.content[1].hidden).toBe(false);

    // The leaving panel stays visible until its transition resolves, which is
    // what v1 bought with `styles.content.closed` and a `transition()` call.
    const leaving = tabs.goTo(0);
    expect(tabs.$refs.content[1].hidden).toBe(false);
    expect(tabs.$refs.content[1].inert).toBe(true);
    await leaving;
    expect(tabs.$refs.content[1].hidden).toBe(true);
    expect(tabs.$refs.content[1].inert).toBe(false);
  });

  it('stops reacting once unmounted.', async () => {
    const tabs = await render();
    const enabled = vi.fn();
    tabs.$on('tabs-enable', enabled);

    tabs.$refs.btn[1].click();
    expect(enabled).toHaveBeenCalledTimes(1);

    // v1's spec called `$destroy()`, which v4 removed: `$unmount()` ends the
    // mount cycle and the same instance can mount again.
    tabs.$unmount();
    tabs.$refs.btn[0].click();
    expect(enabled).toHaveBeenCalledTimes(1);
  });

  it('reports a tab list with no accessible name, and a missing `list` ref.', async () => {
    const diagnostics = captureDiagnostics();
    await render({ unnamed: true });
    expect(diagnostics.codes).toContain('tabs.unnamed-tablist');

    await render({ withoutList: true });
    expect(diagnostics.codes).toContain('tabs.missing-list-ref');
    diagnostics.stop();
  });
});

/** Dispatch a real `keydown` and hand the event back so a test can read it. */
function press(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}
