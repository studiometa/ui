import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, resetDom, settle } from '@studiometa/js-toolkit/test';
import { Disclosure } from '#private/Disclosure/Disclosure.js';
import { DisclosureGroup } from '#private/Disclosure/DisclosureGroup.js';
import { Transition } from '#private/Transition/Transition.js';

registerComponents(Disclosure, DisclosureGroup, Transition);

afterEach(resetDom);

interface ItemOptions {
  open?: boolean;
  disabled?: boolean;
  transition?: boolean;
  transitions?: number;
}

function itemHtml({ open = false, disabled = false, transitions = 0 }: ItemOptions = {}): string {
  const panelTransitions = Array.from(
    { length: transitions },
    () => '<div data-component="Transition" data-option-enter-from="opacity-0"></div>',
  ).join('');

  return `
    <section data-component="Disclosure"${open ? ' data-option-open' : ''}${
      disabled ? ' data-option-disabled' : ''
    }>
      <h3><button type="button" data-ref="trigger">Title</button></h3>
      <div data-ref="panel"${open ? '' : ' hidden'}>${panelTransitions}</div>
    </section>
  `;
}

/** Append markup to the document and wait for everything in it to mount. */
async function render(html: string): Promise<HTMLElement> {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.append(root);
  await settle();
  return root;
}

function disclosureAt(root: ParentNode, index = 0): Disclosure {
  const elements = [...root.querySelectorAll<HTMLElement>('[data-component="Disclosure"]')];
  return getInstance<Disclosure>(elements[index], 'Disclosure')!;
}

function groupOf(element: HTMLElement): DisclosureGroup {
  return getInstance<DisclosureGroup>(element, 'DisclosureGroup')!;
}

/** One macrotask turn, which is what a queued transition chain needs. */
function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** The events a group emitted itself, excluding the ones its children bubbled up. */
function ownEvents(group: DisclosureGroup, type: string): CustomEvent[] {
  const events: CustomEvent[] = [];
  group.$on(type, (event) => {
    if (event.target === group.$el) {
      events.push(event as CustomEvent);
    }
  });
  return events;
}

function refs(disclosure: Disclosure) {
  return {
    trigger: disclosure.$refs.trigger,
    panel: disclosure.$refs.panel,
  };
}

describe('The Disclosure component', () => {
  it('creates an accessible trigger/panel relationship and uses hidden', async () => {
    const root = await render(itemHtml());
    const disclosure = disclosureAt(root);
    const { trigger, panel } = refs(disclosure);

    expect(trigger.id).toBe(`${disclosure.$id}-trigger`);
    expect(panel.id).toBe(`${disclosure.$id}-panel`);
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('aria-labelledby')).toBe(trigger.id);
    expect(panel.hidden).toBe(true);
    expect(panel.hasAttribute('aria-hidden')).toBe(false);
  });

  it('preserves authored IDs', async () => {
    const root = await render(`
      <section data-component="Disclosure">
        <h3><button type="button" id="authored-trigger" data-ref="trigger">Title</button></h3>
        <div id="authored-panel" data-ref="panel" hidden></div>
      </section>
    `);
    const { trigger, panel } = refs(disclosureAt(root));

    expect(trigger.id).toBe('authored-trigger');
    expect(panel.id).toBe('authored-panel');
    expect(trigger.getAttribute('aria-controls')).toBe('authored-panel');
    expect(panel.getAttribute('aria-labelledby')).toBe('authored-trigger');
  });

  it('opens and closes from its native trigger', async () => {
    const root = await render(itemHtml());
    const disclosure = disclosureAt(root);
    const { trigger, panel } = refs(disclosure);
    const open = vi.fn();
    const close = vi.fn();
    disclosure.$on('open', open);
    disclosure.$on('close', close);

    trigger.click();
    await settle();
    expect(disclosure.isOpen).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    expect(open).toHaveBeenCalledOnce();

    trigger.click();
    await settle();
    expect(disclosure.isOpen).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(panel.hasAttribute('aria-hidden')).toBe(false);
    expect(close).toHaveBeenCalledOnce();
  });

  it('emits without a payload and names its emitter as the event target', async () => {
    const root = await render(itemHtml());
    const disclosure = disclosureAt(root);
    const events: Array<{ detail: unknown; target: EventTarget | null }> = [];
    disclosure.$on('open', (event) => {
      events.push({ detail: (event as CustomEvent).detail, target: event.target });
    });

    await disclosure.open();

    expect(events).toEqual([{ detail: null, target: disclosure.$el }]);
  });

  it('returns focus to the trigger before hiding a focused panel', async () => {
    const root = await render(itemHtml({ open: true }));
    const disclosure = disclosureAt(root);
    const { trigger, panel } = refs(disclosure);
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = 'Focusable';
    panel.append(link);
    link.focus();

    await disclosure.close();

    expect(document.activeElement).toBe(trigger);
    expect(panel.hidden).toBe(true);
  });

  it('ignores interaction while disabled', async () => {
    const root = await render(itemHtml({ disabled: true }));
    const disclosure = disclosureAt(root);
    const { trigger, panel } = refs(disclosure);

    expect(trigger.disabled).toBe(true);
    await disclosure.open();
    expect(disclosure.isOpen).toBe(false);
    expect(panel.hidden).toBe(true);

    disclosure.enable();
    expect(trigger.disabled).toBe(false);
    await disclosure.open();
    expect(disclosure.isOpen).toBe(true);
  });

  it('writes the option attribute rather than the read-only option', async () => {
    const root = await render(itemHtml());
    const disclosure = disclosureAt(root);

    disclosure.disable();
    expect(disclosure.$el.hasAttribute('data-option-disabled')).toBe(true);
    expect(disclosure.disabled).toBe(true);

    disclosure.enable();
    expect(disclosure.$el.hasAttribute('data-option-disabled')).toBe(false);
    expect(disclosure.disabled).toBe(false);
  });

  it('re-syncs the trigger when the option is written from the markup', async () => {
    const root = await render(itemHtml());
    const disclosure = disclosureAt(root);

    disclosure.$el.setAttribute('data-option-disabled', '');
    await settle();

    expect(disclosure.$refs.trigger.disabled).toBe(true);
  });

  it('preserves an authored aria-disabled state', async () => {
    const root = await render(`
      <section data-component="Disclosure">
        <h3><button type="button" aria-disabled="true" data-ref="trigger">Title</button></h3>
        <div data-ref="panel" hidden></div>
      </section>
    `);
    const disclosure = disclosureAt(root);
    const { trigger } = refs(disclosure);

    trigger.click();
    await settle();
    disclosure.disable();
    disclosure.enable();

    expect(disclosure.isOpen).toBe(false);
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.disabled).toBe(false);
  });

  it('orchestrates local Transition children', async () => {
    const root = await render(itemHtml({ transitions: 1 }));
    const disclosure = disclosureAt(root);
    const [transition] = disclosure.transitions;
    const enter = vi.spyOn(transition, 'enter').mockResolvedValue();
    const leave = vi.spyOn(transition, 'leave').mockResolvedValue();

    await disclosure.open();
    await disclosure.close();

    expect(enter).toHaveBeenCalledOnce();
    expect(leave).toHaveBeenCalledOnce();
  });

  it('leaves a nested disclosure its own transitions', async () => {
    const root = await render(`
      <section data-component="Disclosure">
        <h3><button type="button" data-ref="trigger">Outer</button></h3>
        <div data-ref="panel" hidden>
          <div data-component="Transition" data-option-enter-from="opacity-0"></div>
          ${itemHtml({ transitions: 1 })}
        </div>
      </section>
    `);
    const [outer, inner] = [disclosureAt(root, 0), disclosureAt(root, 1)];

    expect(outer.transitions).toHaveLength(1);
    expect(inner.transitions).toHaveLength(1);
    expect(outer.transitions[0]).not.toBe(inner.transitions[0]);
  });

  it('serializes opposing transitions and settles both operations', async () => {
    const root = await render(itemHtml({ transitions: 1 }));
    const disclosure = disclosureAt(root);
    const { panel } = refs(disclosure);
    const [transition] = disclosure.transitions;
    let resolveEnter: () => void;
    let resolveLeave: () => void;
    const enter = vi
      .spyOn(transition, 'enter')
      .mockImplementation(() => new Promise<void>((resolve) => (resolveEnter = resolve)));
    const leave = vi
      .spyOn(transition, 'leave')
      .mockImplementation(() => new Promise<void>((resolve) => (resolveLeave = resolve)));

    const opening = disclosure.open();
    await tick();
    const closing = disclosure.close();
    resolveEnter!();
    await tick();
    expect(leave).toHaveBeenCalledOnce();
    resolveLeave!();
    await Promise.all([opening, closing]);

    expect(enter).toHaveBeenCalledOnce();
    expect(panel.hidden).toBe(true);
    expect(panel.inert).toBe(false);
  });

  it('waits for every transition when one rejects', async () => {
    // The component recovers from the rejection and reports it on the
    // diagnostic channel, whose default sink is `reportError()` — a real
    // browser turns that into a global error, which the runner would flag as
    // an unhandled error. Capturing the channel is both how the report is
    // asserted and what suppresses the sink.
    const diagnostics = captureDiagnostics();
    const root = await render(itemHtml({ transitions: 2 }));
    const disclosure = disclosureAt(root);
    const [rejecting, pending] = disclosure.transitions;
    vi.spyOn(rejecting, 'enter').mockRejectedValue(new Error('Failed transition'));
    let resolvePending: () => void;
    vi.spyOn(pending, 'enter').mockImplementation(
      () => new Promise<void>((resolve) => (resolvePending = resolve)),
    );
    const afterOpen = vi.fn();
    disclosure.$on('after-open', afterOpen);

    const opening = disclosure.open();
    await tick();
    expect(afterOpen).not.toHaveBeenCalled();
    resolvePending!();
    await opening;

    expect(afterOpen).toHaveBeenCalledOnce();
    expect(diagnostics.codes).toEqual(['disclosure.transition-failed']);
    diagnostics.stop();
  });

  it('clears transient inert state when unmounted during leave', async () => {
    const root = await render(itemHtml({ open: true, transitions: 1 }));
    const disclosure = disclosureAt(root);
    const { panel } = refs(disclosure);
    const [transition] = disclosure.transitions;
    let resolveLeave: () => void;
    vi.spyOn(transition, 'leave').mockImplementation(
      () => new Promise<void>((resolve) => (resolveLeave = resolve)),
    );

    const closing = disclosure.close();
    await tick();
    expect(panel.inert).toBe(true);

    disclosure.$unmount();
    expect(panel.inert).toBe(false);
    expect(panel.hidden).toBe(true);
    resolveLeave!();
    await closing;
  });
});

describe('The DisclosureGroup component', () => {
  it('claims children that mount with it', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup">${itemHtml()}${itemHtml()}</div>`,
    );
    const group = groupOf(root.firstElementChild as HTMLElement);
    const items = [disclosureAt(root, 0), disclosureAt(root, 1)];

    expect(group.items).toEqual(items);
    expect(items.map((item) => item.group)).toEqual([group, group]);
    expect(items.map((item) => item.index)).toEqual([0, 1]);
  });

  it('claims children that were already mounted when it mounts', async () => {
    const root = await render(`<div>${itemHtml()}${itemHtml()}</div>`);
    const container = root.firstElementChild as HTMLElement;
    const items = [disclosureAt(root, 0), disclosureAt(root, 1)];
    expect(items.map((item) => item.group)).toEqual([undefined, undefined]);

    container.setAttribute('data-component', 'DisclosureGroup');
    await settle();

    const group = groupOf(container);
    expect(group.items).toEqual(items);
    expect(items.map((item) => item.group)).toEqual([group, group]);
  });

  it('migrates a child to a nearer group mounted later', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup"><div class="inner">${itemHtml()}</div></div>`,
    );
    const outerElement = root.firstElementChild as HTMLElement;
    const innerElement = outerElement.querySelector('.inner') as HTMLElement;
    const outer = groupOf(outerElement);
    const disclosure = disclosureAt(root);
    expect(disclosure.group).toBe(outer);

    innerElement.setAttribute('data-component', 'DisclosureGroup');
    await settle();
    const inner = groupOf(innerElement);

    expect(disclosure.group).toBe(inner);
    expect(inner.items).toEqual([disclosure]);
    expect(outer.items).toEqual([]);
  });

  it('keeps a nested child with its inner group whatever the mount order', async () => {
    const root = await render(
      `<div class="outer"><div data-component="DisclosureGroup">${itemHtml()}</div></div>`,
    );
    const outerElement = root.firstElementChild as HTMLElement;
    const innerElement = outerElement.firstElementChild as HTMLElement;
    const inner = groupOf(innerElement);
    const disclosure = disclosureAt(root);
    expect(disclosure.group).toBe(inner);

    outerElement.setAttribute('data-component', 'DisclosureGroup');
    await settle();

    expect(disclosure.group).toBe(inner);
    expect(groupOf(outerElement).items).toEqual([]);
  });

  it('hands its children back to the outer group when it unmounts', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup"><div data-component="DisclosureGroup" class="inner">${itemHtml()}</div></div>`,
    );
    const outerElement = root.firstElementChild as HTMLElement;
    const innerElement = outerElement.querySelector('.inner') as HTMLElement;
    const outer = groupOf(outerElement);
    const inner = groupOf(innerElement);
    const disclosure = disclosureAt(root);
    expect(disclosure.group).toBe(inner);

    inner.$unmount();

    expect(disclosure.group).toBe(outer);
    expect(outer.items).toEqual([disclosure]);
  });

  it('normalizes multiple initial open items in single-open mode by DOM order', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup" data-option-no-multiple>${itemHtml({
        open: true,
      })}${itemHtml({ open: true })}</div>`,
    );
    const group = groupOf(root.firstElementChild as HTMLElement);
    const items = [disclosureAt(root, 0), disclosureAt(root, 1)];

    expect(group.openItems).toEqual([items[0]]);
    expect(items[0].$refs.panel.hidden).toBe(false);
    expect(items[1].$refs.panel.hidden).toBe(true);
  });

  it('closes the previous item when another opens in single-open mode', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup" data-option-no-multiple>${itemHtml({
        open: true,
      })}${itemHtml()}</div>`,
    );
    const group = groupOf(root.firstElementChild as HTMLElement);
    const items = [disclosureAt(root, 0), disclosureAt(root, 1)];

    await group.open(1);

    expect(items.map((item) => item.isOpen)).toEqual([false, true]);
  });

  it('keeps only the latest item open during concurrent requests', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup" data-option-no-multiple>${itemHtml()}${itemHtml()}${itemHtml()}</div>`,
    );
    const group = groupOf(root.firstElementChild as HTMLElement);
    const items = [0, 1, 2].map((index) => disclosureAt(root, index));

    const first = group.open(1);
    const second = group.open(2);
    await Promise.all([first, second]);

    expect(items.map((item) => item.isOpen)).toEqual([false, false, true]);
  });

  it('keeps the latest re-entrant event request in single-open mode', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup" data-option-no-multiple>${itemHtml({
        open: true,
      })}${itemHtml()}${itemHtml()}</div>`,
    );
    const group = groupOf(root.firstElementChild as HTMLElement);
    const items = [0, 1, 2].map((index) => disclosureAt(root, index));
    const reentrant = vi.fn(() => group.open(2));
    group.$on('close', reentrant, { once: true });

    await group.open(1);

    expect(reentrant).toHaveBeenCalledOnce();
    expect(items.map((item) => item.isOpen)).toEqual([false, false, true]);
  });

  it('names the item and its index in the events it relays', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup">${itemHtml()}${itemHtml()}</div>`,
    );
    const group = groupOf(root.firstElementChild as HTMLElement);
    const second = disclosureAt(root, 1);
    const events = ownEvents(group, 'open');

    await second.open();

    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ item: second, index: 1 });
  });

  it('keeps one enabled item open in non-collapsible single-open mode', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup" data-option-no-multiple data-option-no-collapsible>${itemHtml()}${itemHtml()}</div>`,
    );
    const group = groupOf(root.firstElementChild as HTMLElement);
    const items = [disclosureAt(root, 0), disclosureAt(root, 1)];

    expect(group.openItems).toEqual([items[0]]);
    expect(items[0].$refs.trigger.getAttribute('aria-disabled')).toBe('true');

    await group.close(0);
    expect(group.openItems).toEqual([items[0]]);

    await group.open(1);
    expect(group.openItems).toEqual([items[1]]);
    expect(items[0].$refs.trigger.hasAttribute('aria-disabled')).toBe(false);
    expect(items[1].$refs.trigger.getAttribute('aria-disabled')).toBe('true');

    items[1].disable();
    items[1].enable();
    expect(items[1].$refs.trigger.getAttribute('aria-disabled')).toBe('true');
  });

  it('picks up and drops dynamically added children', async () => {
    const root = await render(`<div data-component="DisclosureGroup">${itemHtml()}</div>`);
    const container = root.firstElementChild as HTMLElement;
    const group = groupOf(container);

    const added = document.createElement('div');
    added.innerHTML = itemHtml();
    container.append(added);
    await settle();
    expect(group.items).toHaveLength(2);

    added.remove();
    await settle();
    expect(group.items).toHaveLength(1);
  });

  it('reconnects a mounted disclosure when it moves between groups', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup" class="first">${itemHtml()}</div>
       <div data-component="DisclosureGroup" class="second"></div>`,
    );
    const firstElement = root.querySelector('.first') as HTMLElement;
    const secondElement = root.querySelector('.second') as HTMLElement;
    const first = groupOf(firstElement);
    const second = groupOf(secondElement);
    const element = root.querySelector('[data-component="Disclosure"]') as HTMLElement;
    expect(disclosureAt(root).group).toBe(first);

    secondElement.append(element);
    await settle();

    const disclosure = getInstance<Disclosure>(element, 'Disclosure')!;
    expect(disclosure.group).toBe(second);
    expect(first.items).toEqual([]);
    expect(second.items).toEqual([disclosure]);

    await first.open(disclosure);
    expect(disclosure.isOpen).toBe(false);
  });

  it('relays state changes and exposes open items', async () => {
    const root = await render(
      `<div data-component="DisclosureGroup">${itemHtml()}${itemHtml()}</div>`,
    );
    const group = groupOf(root.firstElementChild as HTMLElement);
    const second = disclosureAt(root, 1);
    const open = ownEvents(group, 'open');
    const change = ownEvents(group, 'change');

    await second.open();

    expect(group.openItems).toEqual([second]);
    expect(open).toHaveLength(1);
    expect(change).toHaveLength(1);
  });
});
