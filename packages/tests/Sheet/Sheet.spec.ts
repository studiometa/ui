import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp } from 'vitest/browser';
import { getInstance, registerComponent } from '@studiometa/js-toolkit';
import { captureDiagnostics, frames, resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Dialog } from '#private/Dialog/Dialog.js';
import { Sheet } from '#private/Sheet/Sheet.js';
import {
  intersectionMockInstance,
  intersectionObserverAfterEachCallback,
  intersectionObserverBeforeAllCallback,
  mockIsIntersecting,
} from '#test-utils';

registerComponent(Dialog);

// The observer is mocked: a test decides when the panel is on screen, so a
// swipe is two reports rather than a gesture headless Chromium cannot make.
beforeAll(intersectionObserverBeforeAllCallback);

beforeEach(async () => {
  // Pinned rather than cleared: a host that prefers reduced motion would
  // otherwise turn every smooth scroll asserted here into an instant one.
  await emulateReducedMotion(false);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await emulateReducedMotion(false);
  document.documentElement.style.overflow = '';
  await resetDom();
  intersectionObserverAfterEachCallback();
});

/**
 * Flip the real `prefers-reduced-motion` setting through the DevTools
 * protocol, so the media query the component reads actually changes.
 */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

/**
 * The visible area is 200px high, so the scroller is 400px: closed at `0`,
 * open at `200` — the end of a 600px content. The 120px panel sits at the
 * bottom of the stage, so it starts entering the visible half at `80` and is
 * fully in at `200`.
 */
const OPEN = 200;

interface RenderOptions {
  attributes?: string;
  scrollerStyle?: string;
  snap?: boolean;
}

async function render({ attributes = '', scrollerStyle = '', snap = true }: RenderOptions = {}) {
  const el = document.createElement('dialog');
  el.setAttribute('data-component', 'Dialog');
  el.style.cssText =
    'margin:0;padding:0;border:0;max-width:none;max-height:none;width:300px;height:200px;overflow:clip';
  el.innerHTML = `
    <div data-component="Sheet" ${attributes}
      style="height:400px;overflow-y:auto;scrollbar-width:none;${snap ? 'scroll-snap-type:y mandatory;' : ''}${scrollerStyle}">
      <div style="height:200px;scroll-snap-align:start"></div>
      <div style="height:200px;display:flex;flex-direction:column;justify-content:flex-end">
        <div data-ref="panel" style="height:120px">panel</div>
      </div>
      <div style="height:200px;scroll-snap-align:end"></div>
    </div>`;
  document.body.append(el);
  await settle();

  const root = el.querySelector<HTMLElement>('[data-component="Sheet"]')!;
  const panel = el.querySelector<HTMLElement>('[data-ref="panel"]')!;

  return {
    el,
    root,
    panel,
    dialog: getInstance<Dialog>(el, 'Dialog')!,
    sheet: getInstance<Sheet>(root, 'Sheet')!,
  };
}

/** Stop the root from scrolling, so only a dispatched `scrollend` can settle. */
function holdScroll(root: HTMLElement) {
  return vi.spyOn(root, 'scrollTo').mockImplementation(() => {});
}

describe('Sheet — a Dialog transition', () => {
  it('is a declared child of Dialog and one of its transitions', async () => {
    const { dialog, sheet } = await render();

    expect(Dialog.config.components.Sheet).toBe(Sheet);
    expect(sheet).toBeInstanceOf(Sheet);
    expect(dialog.transitions).toContain(sheet);
  });

  it('scrolls in when the dialog opens and out before it closes', async () => {
    const { el, root, dialog, sheet } = await render();

    await dialog.open();
    expect(root.scrollTop).toBe(OPEN);
    expect(sheet.progress).toBe(1);

    await dialog.close();
    expect(root.scrollTop).toBe(0);
    expect(el.open).toBe(false);
  });
});

describe('Sheet — enter() and leave()', () => {
  it('scrolls to the open position and resolves on `scrollend`', async () => {
    const { el, root, sheet } = await render();
    el.showModal();
    const scrollTo = holdScroll(root);
    const settled = vi.fn();

    const entering = sheet.enter().then(settled);
    await frames(5);
    expect(scrollTo).toHaveBeenCalledWith({ top: OPEN, behavior: 'smooth' });
    expect(settled).not.toHaveBeenCalled();

    root.dispatchEvent(new Event('scrollend'));
    await entering;
    expect(settled).toHaveBeenCalledOnce();
    expect(sheet.state).toBe('entering');
  });

  it('scrolls back to `0` and resolves on `scrollend`', async () => {
    const { el, root, sheet } = await render();
    el.showModal();
    root.scrollTo({ top: OPEN, behavior: 'instant' });
    // An instant scroll still sends its `scrollend` a frame later: let it pass
    // before listening for the next one.
    await frames(3);
    const scrollTo = holdScroll(root);
    const settled = vi.fn();

    const leaving = sheet.leave().then(settled);
    await frames(5);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(settled).not.toHaveBeenCalled();

    root.dispatchEvent(new Event('scrollend'));
    await leaving;
    expect(settled).toHaveBeenCalledOnce();
    expect(sheet.state).toBe('leaving');
  });

  it('really scrolls, in both directions', async () => {
    const { el, root, sheet } = await render();
    el.showModal();

    await sheet.enter();
    expect(root.scrollTop).toBe(OPEN);

    await sheet.leave();
    expect(root.scrollTop).toBe(0);
  });

  it('resolves `enter()` at once when the sheet is already open', async () => {
    const { el, root, sheet } = await render();
    el.showModal();
    root.scrollTo({ top: OPEN, behavior: 'instant' });
    holdScroll(root);

    // A scroll that does not move fires no `scrollend`: waiting for one
    // would hold the dialog open for good.
    await sheet.enter();
    expect(root.scrollTop).toBe(OPEN);
  });

  it('resolves `leave()` at once when the sheet is already closed', async () => {
    const { el, root, sheet } = await render();
    el.showModal();
    const scrollTo = vi.spyOn(root, 'scrollTo');

    await sheet.leave();
    expect(root.scrollTop).toBe(0);
    expect(scrollTo).not.toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
  });

  it('resolves `leave()` at once, and lands closed, once the panel is out of view', async () => {
    // Without snapping, so the scroller can rest where a swipe is still
    // settling: past the point where the panel left the screen, short of `0`.
    const { el, root, sheet } = await render({ snap: false });
    el.showModal();
    root.scrollTo({ top: 50, behavior: 'instant' });
    expect(sheet.progress).toBe(0);
    const scrollTo = vi.spyOn(root, 'scrollTo');

    await sheet.leave();
    expect(root.scrollTop).toBe(0);
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, behavior: 'instant' });
  });

  it('settles an older scroll when a newer one starts', async () => {
    const { el, root, sheet } = await render();
    el.showModal();
    holdScroll(root);
    const entered = vi.fn();

    const entering = sheet.enter().then(entered);
    await frames(2);
    expect(entered).not.toHaveBeenCalled();

    // A close during the opening scroll: `open()` must not stay pending.
    void sheet.leave();

    await entering;
    expect(entered).toHaveBeenCalledOnce();
  });

  it('settles a pending scroll on unmount, so the dialog is never left waiting', async () => {
    const { el, root, sheet } = await render();
    el.showModal();
    holdScroll(root);

    const entering = sheet.enter();
    sheet.$unmount();

    await expect(entering).resolves.toBeUndefined();
  });

  it('resolves without `scrollend` once the settle timeout has passed', async () => {
    const { el, root, sheet } = await render();
    el.showModal();
    holdScroll(root);
    const settled = vi.fn();

    void sheet.enter().then(settled);
    await frames(5);
    expect(settled).not.toHaveBeenCalled();

    await waitFor(() => settled.mock.calls.length > 0, { timeout: 2000 });
    expect(settled).toHaveBeenCalledOnce();
  });
});

describe('Sheet — swipe to dismiss', () => {
  it('closes the parent Dialog once the panel has left the screen', async () => {
    const { el, root, panel, dialog } = await render();
    await dialog.open();
    await mockIsIntersecting(panel, true, 1);
    const close = vi.spyOn(dialog, 'close');

    // The swipe: the user scrolls the panel out, then the observer reports.
    root.scrollTo({ top: 0, behavior: 'instant' });
    const scrollTo = vi.spyOn(root, 'scrollTo');
    await mockIsIntersecting(panel, false, 0);

    expect(close).toHaveBeenCalledOnce();
    await close.mock.results[0].value;
    expect(el.open).toBe(false);
    // The `leave()` the close ran did not animate a second time.
    expect(scrollTo).not.toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
  });

  it('ignores a panel out of view that was never on screen', async () => {
    const { el, panel, dialog } = await render();
    el.showModal();
    const close = vi.spyOn(dialog, 'close');

    // Every open starts here: out of view, until `enter()` scrolls it in.
    await mockIsIntersecting(panel, false, 0);

    expect(close).not.toHaveBeenCalled();
    expect(el.open).toBe(true);
  });

  it('does not close a dialog that is not open', async () => {
    const { panel, dialog } = await render();
    const close = vi.spyOn(dialog, 'close');

    await mockIsIntersecting(panel, true, 1);
    await mockIsIntersecting(panel, false, 0);

    expect(close).not.toHaveBeenCalled();
  });

  it('does not report its own leave as a swipe', async () => {
    const { el, root, panel, dialog } = await render();
    await dialog.open();
    await mockIsIntersecting(panel, true, 1);
    const close = vi.spyOn(dialog, 'close');
    holdScroll(root);

    const closing = dialog.close();
    // What the observer reports while the leave scroll runs.
    await mockIsIntersecting(panel, true, 0.5);
    await mockIsIntersecting(panel, false, 0);
    root.dispatchEvent(new Event('scrollend'));
    await closing;

    expect(close).toHaveBeenCalledOnce();
    expect(el.open).toBe(false);
  });

  it('closes again on the next swipe after reopening', async () => {
    const { el, root, panel, dialog } = await render();

    for (let cycle = 0; cycle < 2; cycle += 1) {
      await dialog.open();
      await mockIsIntersecting(panel, true, 1);
      root.scrollTo({ top: 0, behavior: 'instant' });
      await mockIsIntersecting(panel, false, 0);
      await waitFor(() => !el.open);
    }

    expect(el.open).toBe(false);
  });

  it('releases the observer on unmount', async () => {
    const { panel, sheet } = await render();
    expect(intersectionMockInstance(panel)).toBeDefined();

    sheet.$unmount();

    expect(() => intersectionMockInstance(panel)).toThrow('Failed to find IntersectionObserver');
  });
});

describe('Sheet — reduced motion', () => {
  it('scrolls instantly under `prefers-reduced-motion`, and follows a change of the setting', async () => {
    const { el, root, sheet } = await render();
    el.showModal();
    const scrollTo = vi.spyOn(root, 'scrollTo');

    await emulateReducedMotion(true);
    // Instant scrolls land synchronously, so there is no `scrollend` to wait for.
    await sheet.enter();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: OPEN, behavior: 'instant' });
    expect(root.scrollTop).toBe(OPEN);
    await frames(3);

    await emulateReducedMotion(false);
    await sheet.leave();
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
    expect(root.scrollTop).toBe(0);
  });
});

describe('Sheet — the timeline', () => {
  it('declares the `--sheet` view timeline on the panel, scoped to the root', async () => {
    const { root, panel } = await render();

    expect(panel.style.getPropertyValue('view-timeline-name')).toBe('--sheet');
    expect(panel.style.getPropertyValue('view-timeline-axis')).toBe('block');
    expect(panel.style.getPropertyValue('view-timeline-inset')).toMatch(/^0(px)? 100dvh$/);
    expect(root.style.getPropertyValue('timeline-scope')).toBe('--sheet');
  });

  it('contains the overscroll, unless the author chose a value', async () => {
    const { root } = await render();
    expect(root.style.getPropertyValue('overscroll-behavior-y')).toBe('contain');

    const { root: authored } = await render({ scrollerStyle: 'overscroll-behavior:none' });
    expect(window.getComputedStyle(authored).overscrollBehaviorY).toBe('none');
  });

  it('removes what it wrote on unmount', async () => {
    const { root, panel, sheet } = await render();

    sheet.$unmount();

    expect(panel.style.getPropertyValue('view-timeline-name')).toBe('');
    expect(panel.style.getPropertyValue('view-timeline-inset')).toBe('');
    expect(root.style.getPropertyValue('timeline-scope')).toBe('');
    expect(root.style.getPropertyValue('overscroll-behavior-y')).toBe('');
  });

  it('publishes `--sheet-progress` where view timelines are not supported', async () => {
    const supports = CSS.supports.bind(CSS);
    vi.spyOn(CSS, 'supports').mockImplementation((...args: [string, string?]) =>
      args[0] === 'animation-timeline: view()' ? false : supports(...args),
    );
    const { el, root } = await render();
    el.showModal();

    await waitFor(() => root.style.getPropertyValue('--sheet-progress') === '0');

    root.scrollTo({ top: OPEN, behavior: 'instant' });
    await waitFor(() => root.style.getPropertyValue('--sheet-progress') === '1');

    root.scrollTo({ top: 0, behavior: 'instant' });
    await waitFor(() => root.style.getPropertyValue('--sheet-progress') === '0');
    expect(root.style.getPropertyValue('--sheet-progress')).toBe('0');
  });

  it('publishes nothing where view timelines are supported', async () => {
    const { el, root } = await render();
    el.showModal();

    root.scrollTo({ top: OPEN, behavior: 'instant' });
    await frames(5);

    expect(root.style.getPropertyValue('--sheet-progress')).toBe('');
  });

  it('measures the progress from layout, so a transformed panel does not move it', async () => {
    const { el, root, panel, sheet } = await render({ snap: false });
    el.showModal();

    root.scrollTo({ top: 140, behavior: 'instant' });
    expect(sheet.progress).toBe(0.5);

    panel.style.transform = 'scale(0.5)';
    expect(sheet.progress).toBe(0.5);
  });
});

describe('Sheet — options', () => {
  it('warns about a position it does not implement', async () => {
    const log = captureDiagnostics();

    await render({ attributes: 'data-option-position="top"' });
    log.stop();

    expect(log.codes).toContain('sheet.unsupported-position');
  });

  it('says nothing for the bottom position', async () => {
    const log = captureDiagnostics();

    await render();
    log.stop();

    expect(log.codes).not.toContain('sheet.unsupported-position');
  });
});
