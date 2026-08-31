import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInstance, registerComponent, type ExtendableDetail } from '@studiometa/js-toolkit';
import { captureDiagnostics, resetDom, settle } from '@studiometa/js-toolkit/test';
import { Transition } from '#private/Transition/Transition.js';
import { Dialog } from '#private/Dialog/Dialog.js';

registerComponent(Dialog);

/** A promise plus the handle that settles it, so a test controls the timing. */
function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/** The `waitUntil()` of an extendable event, or `null` for any other event. */
function detailOf(event: Event): ExtendableDetail | null {
  const { detail } = event as CustomEvent<ExtendableDetail | null>;
  // `<dialog>` fires its own native `close` event once hidden, queued as a
  // task, so it lands after the choreography and shares the name. It carries
  // no detail: every listener on these names has to tell the two apart.
  return typeof detail?.waitUntil === 'function' ? detail : null;
}

/** Listeners to release after each test, since they outlive the dialog. */
const listeners: Array<() => void> = [];

/** Register an extension on one lifecycle event, for the rest of the test. */
function extend(target: EventTarget, event: 'open' | 'close', extension: unknown): void {
  function listener(dispatched: Event) {
    detailOf(dispatched)?.waitUntil(extension as never);
  }
  target.addEventListener(event, listener);
  listeners.push(() => target.removeEventListener(event, listener));
}

afterEach(async () => {
  document.documentElement.style.overflow = '';
  while (listeners.length > 0) {
    listeners.pop()!();
  }
  await resetDom();
});

function render({ modal = true, withTransition = true } = {}): HTMLDialogElement {
  const el = document.createElement('dialog');
  el.setAttribute('data-component', 'Dialog');
  // A boolean is presence: `String(modal)` would read `true` either way.
  if (!modal) {
    el.setAttribute('data-option-no-modal', '');
  }
  el.innerHTML = `
    ${
      withTransition
        ? `<div data-component="Transition" data-option-enter-to="is-open" data-option-enter-keep="" data-option-leave-to="is-closed" data-option-leave-keep="">panel</div>`
        : ''
    }
    <button type="button" id="first">first</button>
    <button type="button" id="last">last</button>
  `;
  document.body.append(el);
  return el;
}

describe('Dialog', () => {
  it('opens and closes the native dialog', async () => {
    const el = render();
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;

    await dialog.open();
    expect(el.open).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');

    await dialog.close();
    expect(el.open).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('is a no-op when already in the requested state', async () => {
    const el = render();
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;

    await dialog.close();
    expect(el.open).toBe(false);
    await dialog.open();
    await dialog.open();
    expect(el.open).toBe(true);
  });

  it('runs the transition children on open and close', async () => {
    const el = render();
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const panel = el.querySelector('[data-component="Transition"]') as HTMLElement;

    expect(dialog.transitions).toHaveLength(1);
    expect(getInstance(panel, 'Transition')!).toBeInstanceOf(Transition);

    await dialog.open();
    expect(panel.classList.contains('is-open')).toBe(true);

    await dialog.close();
    expect(panel.classList.contains('is-open')).toBe(false);
    expect(panel.classList.contains('is-closed')).toBe(true);
  });

  it('picks up a transition child inserted after mount', async () => {
    const el = render({ withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    expect(dialog.transitions).toHaveLength(0);

    const added = document.createElement('div');
    added.setAttribute('data-component', 'Transition');
    added.setAttribute('data-option-enter-to', 'is-open');
    added.setAttribute('data-option-enter-keep', '');
    el.prepend(added);
    await settle();

    expect(dialog.transitions).toHaveLength(1);
    await dialog.open();
    expect(added.classList.contains('is-open')).toBe(true);
  });

  it('closes through the component when Escape cancels the native dialog', async () => {
    const el = render();
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const panel = el.querySelector('[data-component="Transition"]') as HTMLElement;

    await dialog.open();
    expect(el.open).toBe(true);

    const close = vi.spyOn(dialog, 'close');
    el.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(close).toHaveBeenCalledOnce();
    await close.mock.results[0].value;

    expect(el.open).toBe(false);
    expect(panel.classList.contains('is-closed')).toBe(true);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('traps the tab key on the non-modal path only', async () => {
    const el = render({ modal: false, withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    await dialog.open();

    const last = el.querySelector('#last') as HTMLButtonElement;
    const first = el.querySelector('#first') as HTMLButtonElement;
    last.focus();
    expect(document.activeElement).toBe(last);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
    expect(document.activeElement).toBe(first);
  });

  it('releases the keydown listener on unmount', async () => {
    const el = render({ modal: false, withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    await dialog.open();

    const last = el.querySelector('#last') as HTMLButtonElement;
    last.focus();
    dialog.$unmount();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
    expect(document.activeElement).toBe(last);
  });
});

describe('Dialog — the extendable open and close events', () => {
  it('dispatches both events bubbling, with a `waitUntil()` in the detail', async () => {
    const el = render({ withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const seen: CustomEvent[] = [];
    function listener(event: Event) {
      if (detailOf(event)) {
        seen.push(event as CustomEvent);
      }
    }
    // On the document: the events have to bubble out of the dialog for a
    // component that is not a declared child to hear them.
    document.addEventListener('open', listener);
    document.addEventListener('close', listener);
    listeners.push(
      () => document.removeEventListener('open', listener),
      () => document.removeEventListener('close', listener),
    );

    await dialog.open();
    await dialog.close();

    expect(seen.map(({ type }) => type)).toEqual(['open', 'close']);
    for (const event of seen) {
      expect(event.target).toBe(el);
      expect(event.bubbles).toBe(true);
      expect(event.detail.waitUntil).toBeTypeOf('function');
    }
  });

  it('holds the native dialog open until a `close` extension settles', async () => {
    const el = render({ withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const gate = deferred();
    extend(el, 'close', gate.promise);

    await dialog.open();
    const closing = dialog.close();

    // The extension is pending: the dialog is still painted and still owns
    // the page scroll.
    await Promise.resolve();
    expect(el.open).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');

    gate.resolve();
    await closing;
    expect(el.open).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('keeps `open()` pending on an `open` extension without delaying the paint', async () => {
    const el = render({ withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const gate = deferred();
    extend(el, 'open', gate.promise);

    let opened = false;
    const opening = dialog.open().then(() => {
      opened = true;
    });

    // The native dialog shows immediately; only the promise waits.
    expect(el.open).toBe(true);
    await Promise.resolve();
    expect(opened).toBe(false);

    gate.resolve();
    await opening;
    expect(opened).toBe(true);
  });

  it('accepts a function and an object with a method named for the event', async () => {
    const el = render({ withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const called: string[] = [];
    const fn = vi.fn(async () => {
      called.push('function');
    });
    // The duck-typed method has the name of the *event*, which is what
    // `emitExtendable()` looks up — not the `enter()`/`leave()` pair v1 used.
    const extension = {
      open: vi.fn(async () => {
        called.push('open');
      }),
      close: vi.fn(async () => {
        called.push('close');
      }),
    };
    extend(el, 'open', fn);
    extend(el, 'open', extension);
    extend(el, 'close', extension);

    await dialog.open();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(extension.open).toHaveBeenCalledTimes(1);
    expect(extension.close).not.toHaveBeenCalled();

    await dialog.close();
    expect(extension.close).toHaveBeenCalledTimes(1);
    expect(called).toEqual(['function', 'open', 'close']);
  });

  it('awaits every registration, not just the last one', async () => {
    const el = render({ withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const first = deferred();
    const second = deferred();
    extend(el, 'close', first.promise);
    extend(document.body, 'close', second.promise);

    await dialog.open();
    const closing = dialog.close();

    first.resolve();
    await Promise.resolve();
    // One of the two is still pending: the dialog must not hide yet.
    expect(el.open).toBe(true);

    second.resolve();
    await closing;
    expect(el.open).toBe(false);
  });

  it('runs the extensions alongside the declared transition children', async () => {
    const el = render();
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const panel = el.querySelector('[data-component="Transition"]') as HTMLElement;
    const gate = deferred();
    extend(el, 'close', gate.promise);

    await dialog.open();
    const closing = dialog.close();

    // The child ran without waiting for the extension — the two are
    // concurrent, not sequential — and the dialog waits for both.
    await settle();
    expect(panel.classList.contains('is-closed')).toBe(true);
    expect(el.open).toBe(true);

    gate.resolve();
    await closing;
    expect(el.open).toBe(false);
  });

  it('never receives a registration from a declared transition child', async () => {
    const el = render();
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const panel = el.querySelector('[data-component="Transition"]') as HTMLElement;
    const heard = vi.fn();
    // The events are dispatched on the dialog and bubble upwards: a child
    // cannot hear them, so it cannot register itself a second time.
    panel.addEventListener('open', heard);
    panel.addEventListener('close', heard);

    await dialog.open();
    await dialog.close();
    expect(heard).not.toHaveBeenCalled();
  });

  it('completes the choreography when an extension fails', async () => {
    const el = render({ withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const log = captureDiagnostics();
    extend(el, 'close', Promise.reject(new Error('extension failed')));

    await dialog.open();
    await dialog.close();

    expect(log.codes).toContain('callback.extendable-event-extension-failed');
    log.stop();

    // A failing extension must never leave the dialog painted and the page
    // locked.
    expect(el.open).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('ignores and reports a registration made after the event dispatched', async () => {
    const el = render({ withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const log = captureDiagnostics();
    const gate = deferred();
    let waitUntil: ExtendableDetail['waitUntil'] | undefined;
    function listener(event: Event) {
      waitUntil = detailOf(event)?.waitUntil ?? waitUntil;
    }
    el.addEventListener('close', listener);
    listeners.push(() => el.removeEventListener('close', listener));

    await dialog.open();
    await dialog.close();

    // The dialog already closed; a late hold on it is refused.
    waitUntil?.(gate.promise);
    expect(log.codes).toContain('protocol.late-registration');
    log.stop();
    gate.resolve();
  });

  it('shares one choreography between concurrent `close()` calls', async () => {
    const el = render({ withTransition: false });
    await settle();
    const dialog = getInstance<Dialog>(el, 'Dialog')!;
    const gate = deferred();
    const extension = vi.fn(() => gate.promise);
    extend(el, 'close', extension);

    await dialog.open();
    const first = dialog.close();
    const second = dialog.close();

    gate.resolve();
    await Promise.all([first, second]);

    // One `close` event, one extension run, one native close.
    expect(extension).toHaveBeenCalledTimes(1);
    expect(el.open).toBe(false);
  });
});

describe('Dialog — the page scroll', () => {
  it('keeps the page locked while a second dialog is still open', async () => {
    const first = render({ withTransition: false });
    const second = render({ withTransition: false });
    await settle();

    await getInstance<Dialog>(first, 'Dialog')!.open();
    await getInstance<Dialog>(second, 'Dialog')!.open();
    expect(document.documentElement.style.overflow).toBe('hidden');

    await getInstance<Dialog>(second, 'Dialog')!.close();

    // The first one is still open: the page is not its to give back.
    expect(document.documentElement.style.overflow).toBe('hidden');

    await getInstance<Dialog>(first, 'Dialog')!.close();
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('gives the scroll back when a dialog is unmounted while open', async () => {
    const el = render({ withTransition: false });
    await settle();
    await getInstance<Dialog>(el, 'Dialog')!.open();
    expect(document.documentElement.style.overflow).toBe('hidden');

    el.remove();
    await settle();

    expect(document.documentElement.style.overflow).toBe('');
  });
});
