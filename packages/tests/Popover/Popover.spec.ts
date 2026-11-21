import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInstance, registerComponent, type ExtendableDetail } from '@studiometa/js-toolkit';
import { resetDom, settle } from '@studiometa/js-toolkit/test';
import { Popover } from '#private/Popover/Popover.js';

registerComponent(Popover);

/** A promise plus the handle that settles it, so a test controls the timing. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** Listeners to release after each test, since they outlive the popover. */
const listeners: Array<() => void> = [];

/** Register an extension on one lifecycle event, for the rest of the test. */
function extend(target: EventTarget, event: 'open' | 'close', extension: unknown): void {
  function listener(dispatched: Event) {
    (dispatched as CustomEvent<ExtendableDetail>).detail.waitUntil(extension as never);
  }
  target.addEventListener(event, listener);
  listeners.push(() => target.removeEventListener(event, listener));
}

/** Record the extendable events dispatched on the element, in order. */
function record(el: HTMLElement): string[] {
  const seen: string[] = [];
  for (const type of ['open', 'close']) {
    function listener() {
      seen.push(type);
    }
    el.addEventListener(type, listener);
    listeners.push(() => el.removeEventListener(type, listener));
  }
  return seen;
}

/** The native `toggle` event is queued as a task: wait for it. */
function nextToggle(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    el.addEventListener('toggle', () => setTimeout(resolve), { once: true });
  });
}

afterEach(async () => {
  while (listeners.length > 0) {
    listeners.pop()!();
  }
  await resetDom();
});

function render({ mode = 'manual', withTransition = true } = {}): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('data-component', 'Popover');
  el.setAttribute('popover', mode);
  el.innerHTML = withTransition
    ? `<div data-component="Transition" data-option-enter-to="is-open" data-option-enter-keep="" data-option-leave-to="is-closed" data-option-leave-keep="">panel</div>`
    : 'panel';
  document.body.append(el);
  return el;
}

async function mountPopover(options?: Parameters<typeof render>[0]) {
  const el = render(options);
  await settle();
  const popover = getInstance<Popover>(el, 'Popover')!;
  const panel = el.querySelector<HTMLElement>('[data-component="Transition"]');
  return { el, popover, panel };
}

function isShown(el: HTMLElement): boolean {
  return el.matches(':popover-open');
}

describe('Popover', () => {
  it('is closed on mount', async () => {
    const { el, popover } = await mountPopover();
    expect(popover.isOpen).toBe(false);
    expect(popover.popover).toBe(el);
    expect(isShown(el)).toBe(false);
  });

  it('shows and hides the native popover', async () => {
    const { el, popover } = await mountPopover();

    await popover.open();
    expect(isShown(el)).toBe(true);
    expect(popover.isOpen).toBe(true);

    await popover.close();
    expect(isShown(el)).toBe(false);
    expect(popover.isOpen).toBe(false);
  });

  it('is a no-op when already in the requested state', async () => {
    const { el, popover } = await mountPopover();
    const seen = record(el);

    await popover.close();
    await popover.open();
    await popover.open();
    expect(isShown(el)).toBe(true);
    expect(seen).toEqual(['open']);
  });

  it('toggles between open and closed', async () => {
    const { el, popover } = await mountPopover();

    await popover.toggle();
    expect(isShown(el)).toBe(true);
    await popover.toggle();
    expect(isShown(el)).toBe(false);
  });

  it('runs the transition children on open and close', async () => {
    const { popover, panel } = await mountPopover();
    expect(popover.transitions).toHaveLength(1);

    await popover.open();
    expect(panel!.classList.contains('is-open')).toBe(true);

    await popover.close();
    expect(panel!.classList.contains('is-open')).toBe(false);
    expect(panel!.classList.contains('is-closed')).toBe(true);
  });

  it('keeps the popover painted until the leave transitions end', async () => {
    const { el, popover } = await mountPopover();
    await popover.open();

    const [transition] = popover.transitions;
    const gate = deferred();
    vi.spyOn(transition, 'leave').mockReturnValue(gate.promise);

    const closing = popover.close();
    await Promise.resolve();
    expect(popover.isOpen).toBe(false);
    expect(isShown(el)).toBe(true);

    gate.resolve();
    await closing;
    expect(isShown(el)).toBe(false);
  });

  it('shares one run between overlapping `close()` calls', async () => {
    const { el, popover } = await mountPopover();
    await popover.open();
    const seen = record(el);

    const [transition] = popover.transitions;
    const gate = deferred();
    const leave = vi.spyOn(transition, 'leave').mockReturnValue(gate.promise);

    const first = popover.close();
    const second = popover.close();
    gate.resolve();
    await Promise.all([first, second]);

    expect(leave).toHaveBeenCalledOnce();
    expect(seen).toEqual(['close']);
    expect(isShown(el)).toBe(false);
  });

  it('stays shown when reopened during the leave transitions', async () => {
    const { el, popover } = await mountPopover();
    await popover.open();

    const [transition] = popover.transitions;
    const gate = deferred();
    vi.spyOn(transition, 'leave').mockReturnValueOnce(gate.promise);

    const closing = popover.close();
    await popover.open();
    gate.resolve();
    await closing;

    expect(popover.isOpen).toBe(true);
    expect(isShown(el)).toBe(true);

    // A later close still hides it.
    await popover.close();
    expect(isShown(el)).toBe(false);
  });
});

describe('Popover — the extendable open and close events', () => {
  it('dispatches both events bubbling, with a `waitUntil()` in the detail', async () => {
    const { el, popover } = await mountPopover({ withTransition: false });
    const seen: CustomEvent<ExtendableDetail>[] = [];
    function listener(event: Event) {
      seen.push(event as CustomEvent<ExtendableDetail>);
    }
    document.addEventListener('open', listener);
    document.addEventListener('close', listener);
    listeners.push(
      () => document.removeEventListener('open', listener),
      () => document.removeEventListener('close', listener),
    );

    await popover.open();
    await popover.close();

    expect(seen.map(({ type }) => type)).toEqual(['open', 'close']);
    for (const event of seen) {
      expect(event.target).toBe(el);
      expect(event.bubbles).toBe(true);
      expect(event.detail.waitUntil).toBeTypeOf('function');
    }
  });

  it('keeps the popover painted until a `close` extension settles', async () => {
    const { el, popover } = await mountPopover({ withTransition: false });
    const gate = deferred();
    extend(el, 'close', gate.promise);

    await popover.open();
    const closing = popover.close();
    await Promise.resolve();
    expect(isShown(el)).toBe(true);

    gate.resolve();
    await closing;
    expect(isShown(el)).toBe(false);
  });

  it('keeps `open()` pending on an `open` extension without delaying the paint', async () => {
    const { el, popover } = await mountPopover({ withTransition: false });
    const gate = deferred();
    extend(el, 'open', gate.promise);

    let opened = false;
    const opening = popover.open().then(() => {
      opened = true;
    });

    expect(isShown(el)).toBe(true);
    await Promise.resolve();
    expect(opened).toBe(false);

    gate.resolve();
    await opening;
    expect(opened).toBe(true);
  });
});

describe('Popover — platform toggles', () => {
  it('ignores the `toggle` events of its own calls', async () => {
    const { el, popover } = await mountPopover();
    const seen = record(el);

    const shown = nextToggle(el);
    await popover.open();
    await shown;
    const hidden = nextToggle(el);
    await popover.close();
    await hidden;

    expect(seen).toEqual(['open', 'close']);
  });

  it('syncs its state and emits `close` when the platform hides it', async () => {
    const { el, popover } = await mountPopover({ mode: 'auto' });
    await popover.open();
    const seen = record(el);

    // What a light-dismiss or Escape does: hide without `close()`.
    const hidden = nextToggle(el);
    el.hidePopover();
    await hidden;

    expect(popover.isOpen).toBe(false);
    expect(seen).toEqual(['close']);

    // It opens again afterwards.
    await popover.open();
    expect(isShown(el)).toBe(true);
  });

  it('syncs its state and runs the enter transitions when the platform shows it', async () => {
    const { el, popover, panel } = await mountPopover({ mode: 'auto' });
    const seen = record(el);

    // What a `popovertarget` button does: show without `open()`.
    const shown = nextToggle(el);
    el.showPopover();
    await shown;
    await settle();

    expect(popover.isOpen).toBe(true);
    expect(seen).toEqual(['open']);
    expect(panel!.classList.contains('is-open')).toBe(true);

    await popover.close();
    expect(isShown(el)).toBe(false);
  });

  it('stays shown when the platform hides and shows it again during `close()`', async () => {
    const { el, popover } = await mountPopover({ mode: 'auto' });
    await popover.open();

    const [transition] = popover.transitions;
    const gate = deferred();
    vi.spyOn(transition, 'leave').mockReturnValueOnce(gate.promise);
    const closing = popover.close();

    // A light-dismiss, then a `popovertarget` button, during the leave.
    const hidden = nextToggle(el);
    el.hidePopover();
    await hidden;
    const shown = nextToggle(el);
    el.showPopover();
    await shown;

    gate.resolve();
    await closing;
    expect(popover.isOpen).toBe(true);
    expect(isShown(el)).toBe(true);
  });
});
