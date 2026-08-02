import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Base } from '@studiometa/js-toolkit';
import { Disclosure, DisclosureGroup } from '@studiometa/ui';
import { h, mount, destroy, wait } from '#test-utils';

const instances: Base[] = [];

function createDisclosureElement({ open = false, disabled = false, transition = false } = {}) {
  const trigger = h('button', { type: 'button', dataRef: 'trigger' }, ['Title']);
  const transitionElement = transition
    ? h('div', {
        dataComponent: 'Transition',
        dataOptionEnterFrom: 'opacity-0',
        dataOptionLeaveTo: 'opacity-0',
      })
    : h('div');
  const panel = h('div', { dataRef: 'panel', ...(open ? {} : { hidden: '' }) }, [
    transitionElement,
  ]);
  const element = h(
    'section',
    {
      dataComponent: 'Disclosure',
      ...(open ? { dataOptionOpen: '' } : {}),
      ...(disabled ? { dataOptionDisabled: '' } : {}),
    },
    [h('h3', [trigger]), panel],
  );
  return { element, trigger, panel };
}

async function createDisclosure(options = {}) {
  const context = createDisclosureElement(options);
  const disclosure = new Disclosure(context.element);
  document.body.append(context.element);
  await mount(disclosure);
  instances.push(disclosure);
  return { ...context, disclosure };
}

function createGroupElement(
  itemOptions: Array<{ open?: boolean; disabled?: boolean }> = [{}, {}],
  options: { multiple?: boolean; collapsible?: boolean } = {},
) {
  const items = itemOptions.map(createDisclosureElement);
  const element = h(
    'div',
    {
      dataComponent: 'DisclosureGroup',
      ...(options.multiple === false ? { dataOptionNoMultiple: '' } : {}),
      ...(options.collapsible === false ? { dataOptionNoCollapsible: '' } : {}),
    },
    items.map((item) => item.element),
  );
  return { element, items };
}

async function mountGroup(
  context: ReturnType<typeof createGroupElement>,
  order: 'group-first' | 'children-first' = 'group-first',
) {
  const group = new DisclosureGroup(context.element);
  const disclosures = context.items.map((item) => new Disclosure(item.element));
  document.body.append(context.element);

  if (order === 'group-first') {
    await mount(group);
    instances.push(group);
  }

  for (const disclosure of disclosures) {
    await mount(disclosure);
    instances.push(disclosure);
  }

  if (order === 'children-first') {
    await mount(group);
    instances.push(group);
  }

  await wait();
  return { group, disclosures };
}

afterEach(async () => {
  await destroy(...instances.reverse());
  instances.length = 0;
  document.body.innerHTML = '';
});

describe('The Disclosure component', () => {
  it('creates an accessible trigger/panel relationship and uses hidden', async () => {
    const { disclosure, trigger, panel } = await createDisclosure();

    expect(trigger.id).toBe(`${disclosure.$id}-trigger`);
    expect(panel.id).toBe(`${disclosure.$id}-panel`);
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('aria-labelledby')).toBe(trigger.id);
    expect(panel.hidden).toBe(true);
    expect(panel.hasAttribute('aria-hidden')).toBe(false);
  });

  it('preserves authored IDs', async () => {
    const context = createDisclosureElement();
    context.trigger.id = 'authored-trigger';
    context.panel.id = 'authored-panel';
    const disclosure = new Disclosure(context.element);
    document.body.append(context.element);
    await mount(disclosure);
    instances.push(disclosure);

    expect(context.trigger.id).toBe('authored-trigger');
    expect(context.panel.id).toBe('authored-panel');
    expect(context.trigger.getAttribute('aria-controls')).toBe('authored-panel');
    expect(context.panel.getAttribute('aria-labelledby')).toBe('authored-trigger');
  });

  it('opens and closes from its native trigger', async () => {
    const { disclosure, trigger, panel } = await createDisclosure();
    const open = vi.fn();
    const close = vi.fn();
    disclosure.$on('open', open);
    disclosure.$on('close', close);

    trigger.click();
    await wait(0);
    expect(disclosure.isOpen).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    expect(open).toHaveBeenCalledOnce();

    trigger.click();
    await wait(0);
    expect(disclosure.isOpen).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(panel.hasAttribute('aria-hidden')).toBe(false);
    expect(close).toHaveBeenCalledOnce();
  });

  it('returns focus to the trigger before hiding a focused panel', async () => {
    const { disclosure, trigger, panel } = await createDisclosure({ open: true });
    const link = h('a', { href: '#' }, ['Focusable']);
    panel.append(link);
    link.focus();

    await disclosure.close();

    expect(document.activeElement).toBe(trigger);
    expect(panel.hidden).toBe(true);
  });

  it('ignores interaction while disabled', async () => {
    const { disclosure, trigger, panel } = await createDisclosure({ disabled: true });

    expect(trigger.disabled).toBe(true);
    await disclosure.open();
    expect(disclosure.isOpen).toBe(false);
    expect(panel.hidden).toBe(true);

    disclosure.enable();
    expect(trigger.disabled).toBe(false);
    await disclosure.open();
    expect(disclosure.isOpen).toBe(true);
  });

  it('preserves an authored aria-disabled state', async () => {
    const context = createDisclosureElement();
    context.trigger.setAttribute('aria-disabled', 'true');
    const disclosure = new Disclosure(context.element);
    document.body.append(context.element);
    await mount(disclosure);
    instances.push(disclosure);

    context.trigger.click();
    await disclosure.$update();
    disclosure.disable();
    disclosure.enable();

    expect(disclosure.isOpen).toBe(false);
    expect(context.trigger.getAttribute('aria-disabled')).toBe('true');
    expect(context.trigger.disabled).toBe(false);
  });

  it('orchestrates local Transition children', async () => {
    const { disclosure } = await createDisclosure({ transition: true });
    const [transition] = disclosure.transitions;
    const enter = vi.spyOn(transition, 'enter').mockResolvedValue();
    const leave = vi.spyOn(transition, 'leave').mockResolvedValue();

    await disclosure.open();
    await disclosure.close();

    expect(enter).toHaveBeenCalledOnce();
    expect(leave).toHaveBeenCalledOnce();
  });

  it('serializes opposing transitions and settles both operations', async () => {
    const { disclosure, panel } = await createDisclosure({ transition: true });
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
    await wait(0);
    const closing = disclosure.close();
    resolveEnter!();
    await wait(0);
    expect(leave).toHaveBeenCalledOnce();
    resolveLeave!();
    await Promise.all([opening, closing]);

    expect(enter).toHaveBeenCalledOnce();
    expect(panel.hidden).toBe(true);
    expect(panel.inert).toBe(false);
  });

  it('waits for every transition when one rejects', async () => {
    const context = createDisclosureElement({ transition: true });
    context.panel.append(
      h('div', {
        dataComponent: 'Transition',
        dataOptionEnterFrom: 'opacity-0',
      }),
    );
    const disclosure = new Disclosure(context.element);
    document.body.append(context.element);
    await mount(disclosure);
    instances.push(disclosure);
    const [rejecting, pending] = disclosure.transitions;
    vi.spyOn(rejecting, 'enter').mockRejectedValue(new Error('Failed transition'));
    let resolvePending: () => void;
    vi.spyOn(pending, 'enter').mockImplementation(
      () => new Promise<void>((resolve) => (resolvePending = resolve)),
    );
    const afterOpen = vi.fn();
    disclosure.$on('after-open', afterOpen);

    const opening = disclosure.open();
    await wait(0);
    expect(afterOpen).not.toHaveBeenCalled();
    resolvePending!();
    await opening;

    expect(afterOpen).toHaveBeenCalledOnce();
  });

  it('clears transient inert state when destroyed during leave', async () => {
    const { disclosure, panel } = await createDisclosure({ open: true, transition: true });
    const [transition] = disclosure.transitions;
    let resolveLeave: () => void;
    vi.spyOn(transition, 'leave').mockImplementation(
      () => new Promise<void>((resolve) => (resolveLeave = resolve)),
    );

    const closing = disclosure.close();
    await wait(0);
    expect(panel.inert).toBe(true);
    await disclosure.$destroy();
    instances.splice(instances.indexOf(disclosure), 1);
    expect(panel.inert).toBe(false);
    expect(panel.hidden).toBe(true);
    resolveLeave!();
    await closing;
  });
});

describe('The DisclosureGroup component', () => {
  it.each(['group-first', 'children-first'] as const)(
    'registers independently mounted children in %s order',
    async (order) => {
      const context = createGroupElement();
      const { group, disclosures } = await mountGroup(context, order);

      expect(group.items).toEqual(disclosures);
      expect(disclosures.map((item) => item.group)).toEqual([group, group]);
      expect(disclosures.map((item) => item.index)).toEqual([0, 1]);
    },
  );

  it('migrates a child to a nearer group mounted later', async () => {
    const child = createDisclosureElement();
    const innerElement = h('div', { dataComponent: 'DisclosureGroup' }, [child.element]);
    const outerElement = h('div', { dataComponent: 'DisclosureGroup' }, [innerElement]);
    const outer = new DisclosureGroup(outerElement);
    const inner = new DisclosureGroup(innerElement);
    const disclosure = new Disclosure(child.element);
    document.body.append(outerElement);

    await mount(outer);
    instances.push(outer);
    await mount(disclosure);
    instances.push(disclosure);
    expect(disclosure.group).toBe(outer);

    await mount(inner);
    instances.push(inner);
    await wait(0);

    expect(disclosure.group).toBe(inner);
    expect(inner.items).toEqual([disclosure]);
    expect(outer.items).toEqual([]);
  });

  it('normalizes multiple initial open items in single-open mode by DOM order', async () => {
    const context = createGroupElement([{ open: true }, { open: true }], { multiple: false });
    const { group, disclosures } = await mountGroup(context, 'children-first');

    expect(group.openItems).toEqual([disclosures[0]]);
    expect(disclosures[0].$refs.panel.hidden).toBe(false);
    expect(disclosures[1].$refs.panel.hidden).toBe(true);
  });

  it('closes the previous item when another opens in single-open mode', async () => {
    const context = createGroupElement([{ open: true }, {}], { multiple: false });
    const { group, disclosures } = await mountGroup(context);

    await group.open(1);

    expect(disclosures.map((item) => item.isOpen)).toEqual([false, true]);
  });

  it('keeps only the latest item open during concurrent requests', async () => {
    const context = createGroupElement([{}, {}, {}], { multiple: false });
    const { group, disclosures } = await mountGroup(context);

    const first = group.open(1);
    const second = group.open(2);
    await Promise.all([first, second]);

    expect(disclosures.map((item) => item.isOpen)).toEqual([false, false, true]);
  });

  it('keeps the latest re-entrant event request in single-open mode', async () => {
    const context = createGroupElement([{ open: true }, {}, {}], { multiple: false });
    const { group, disclosures } = await mountGroup(context);
    const reentrant = vi.fn(() => group.open(2));
    group.$on('close', reentrant, { once: true });

    await group.open(1);

    expect(reentrant).toHaveBeenCalledOnce();
    expect(disclosures.map((item) => item.isOpen)).toEqual([false, false, true]);
  });

  it('keeps one enabled item open in non-collapsible single-open mode', async () => {
    const context = createGroupElement([{}, {}], {
      multiple: false,
      collapsible: false,
    });
    const { group, disclosures } = await mountGroup(context);

    expect(group.openItems).toEqual([disclosures[0]]);
    expect(disclosures[0].$refs.trigger.getAttribute('aria-disabled')).toBe('true');

    await group.close(0);
    expect(group.openItems).toEqual([disclosures[0]]);

    await group.open(1);
    expect(group.openItems).toEqual([disclosures[1]]);
    expect(disclosures[0].$refs.trigger.hasAttribute('aria-disabled')).toBe(false);
    expect(disclosures[1].$refs.trigger.getAttribute('aria-disabled')).toBe('true');

    await disclosures[1].$update();
    disclosures[1].disable();
    disclosures[1].enable();
    expect(disclosures[1].$refs.trigger.getAttribute('aria-disabled')).toBe('true');
  });

  it('registers and unregisters dynamically added children', async () => {
    const context = createGroupElement([{}]);
    const { group } = await mountGroup(context);
    const dynamic = createDisclosureElement();
    const disclosure = new Disclosure(dynamic.element);
    context.element.append(dynamic.element);
    await mount(disclosure);
    instances.push(disclosure);

    expect(group.items).toHaveLength(2);
    await disclosure.$destroy();
    instances.splice(instances.indexOf(disclosure), 1);
    expect(group.items).toHaveLength(1);
  });

  it('reconnects a mounted disclosure when it moves between groups', async () => {
    const child = createDisclosureElement();
    const firstElement = h('div', { dataComponent: 'DisclosureGroup' }, [child.element]);
    const secondElement = h('div', { dataComponent: 'DisclosureGroup' });
    const first = new DisclosureGroup(firstElement);
    const second = new DisclosureGroup(secondElement);
    const disclosure = new Disclosure(child.element);
    document.body.append(firstElement, secondElement);
    await mount(first, second, disclosure);
    instances.push(first, second, disclosure);
    await wait();
    expect(disclosure.group).toBe(first);

    secondElement.append(child.element);
    await wait();

    expect(disclosure.group).toBe(second);
    expect(first.items).toEqual([]);
    expect(second.items).toEqual([disclosure]);
    await first.open(disclosure);
    expect(disclosure.isOpen).toBe(false);
  });

  it('reconnects nested disclosures when their inner group is destroyed', async () => {
    const child = createDisclosureElement();
    const innerElement = h('div', { dataComponent: 'DisclosureGroup' }, [child.element]);
    const outerElement = h('div', { dataComponent: 'DisclosureGroup' }, [innerElement]);
    const outer = new DisclosureGroup(outerElement);
    const inner = new DisclosureGroup(innerElement);
    const disclosure = new Disclosure(child.element);
    document.body.append(outerElement);
    await mount(outer, inner, disclosure);
    instances.push(outer, inner, disclosure);
    await wait();
    expect(disclosure.group).toBe(inner);

    await inner.$destroy();
    instances.splice(instances.indexOf(inner), 1);

    expect(disclosure.group).toBe(outer);
    expect(outer.items).toEqual([disclosure]);
  });

  it('relays state changes and exposes open items', async () => {
    const context = createGroupElement();
    const { group, disclosures } = await mountGroup(context);
    const open = vi.fn();
    const change = vi.fn();
    group.$on('open', open);
    group.$on('change', change);

    await disclosures[1].open();

    expect(group.openItems).toEqual([disclosures[1]]);
    expect(open).toHaveBeenCalledOnce();
    expect(change).toHaveBeenCalledOnce();
  });
});
