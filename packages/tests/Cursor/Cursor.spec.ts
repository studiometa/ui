import { afterEach, describe, expect, it } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import {
  captureDiagnostics,
  countRequestedFrames,
  mount,
  resetDom,
  settle,
  waitFor,
} from '@studiometa/js-toolkit/test';
import { Cursor } from '#private/Cursor/Cursor.js';

registerComponents(Cursor);

/** The pointer service is page-wide, so a spec must put the button back up. */
afterEach(async () => {
  document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await resetDom();
});

const STATES = '{"a": "grow", "[data-cursor-shrink]": "shrink"}';

async function mountCursor(
  attributes = '',
  inner = '',
): Promise<{ root: HTMLElement; el: HTMLElement; instance: Cursor }> {
  const root = await mount(
    `<div data-component="Cursor" style="position:fixed;top:0;left:0;width:20px;height:20px" ${attributes}>${inner}</div>`,
  );
  const el = root.firstElementChild as HTMLElement;
  return { root, el, instance: getInstance<Cursor>(el, 'Cursor')! };
}

function movePointer(target: EventTarget, x: number, y: number, buttons = 0): void {
  target.dispatchEvent(
    new PointerEvent('pointermove', {
      clientX: x,
      clientY: y,
      buttons,
      bubbles: true,
      composed: true,
    }),
  );
}

function pressPointer(target: EventTarget, x: number, y: number): void {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 1,
      bubbles: true,
      composed: true,
    }),
  );
}

function releasePointer(target: EventTarget = document.body): void {
  target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true }));
}

/** The two published coordinates, read back through the cascade. */
function published(el: HTMLElement): [string, string] {
  const styles = getComputedStyle(el);
  return [
    styles.getPropertyValue('--cursor-x').trim(),
    styles.getPropertyValue('--cursor-y').trim(),
  ];
}

/** A bounded quiet period, for the assertion that no frame was requested. */
async function quiet(count = 12): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await settle();
  }
}

describe('Cursor — published position', () => {
  it('publishes `--cursor-x` and `--cursor-y` in pixels', async () => {
    const { el, instance } = await mountCursor();

    expect(published(el)).toEqual(['0px', '0px']);

    movePointer(document, 120, 80);
    await waitFor(() => !instance.motion.isMoving);

    expect(published(el)).toEqual(['120px', '80px']);
  });

  it('records the raw pointer position the frame it moves', async () => {
    const { instance } = await mountCursor();

    movePointer(document, 120, 80);
    await settle();

    expect(instance.motion.raw().x).toBe(120);
    expect(instance.motion.raw().y).toBe(80);
  });

  it('damps its way to the pointer instead of jumping there', async () => {
    const { el, instance } = await mountCursor();

    movePointer(document, 200, 100);
    await settle();

    // One frame in, it has started but not arrived — and the published value
    // is the damped one, not the target.
    const [x] = published(el);
    expect(Number.parseFloat(x)).toBeGreaterThan(0);
    expect(Number.parseFloat(x)).toBeLessThan(200);
    expect(instance.motion.raw().x).toBe(200);

    await waitFor(() => !instance.motion.isMoving);

    expect(published(el)).toEqual(['200px', '100px']);
  });

  it('damps faster with a higher `damping`', async () => {
    const slow = await mountCursor('data-option-damping="0.05" id="slow"');
    const fast = await mountCursor('data-option-damping="0.9" id="fast"');

    movePointer(document, 500, 0);
    await settle();

    const slowX = Number.parseFloat(published(slow.el)[0]);
    const fastX = Number.parseFloat(published(fast.el)[0]);

    expect(fastX).toBeGreaterThan(slowX);
    expect(slowX).toBeLessThan(500);
  });

  it('still writes the transform itself, so the default needs no stylesheet', async () => {
    const { el, instance } = await mountCursor();

    expect(el.style.translate).toBe('0px');

    movePointer(document, 50, 25);
    await waitFor(() => !instance.motion.isMoving);

    expect(el.style.translate).toBe('50px 25px');
    // The position goes into `translate`, which composes outside a `scale`
    // from a stylesheet. `transform` is left entirely to the author.
    expect(el.style.transform).toBe('');
  });

  it('starts the frame loop on a move and stops it once it has caught up', async () => {
    const { instance } = await mountCursor();

    expect(instance.motion.isMoving).toBe(false);

    movePointer(document, 150, 150);
    await settle();
    expect(instance.motion.isMoving).toBe(true);

    await waitFor(() => !instance.motion.isMoving);

    expect(instance.motion.isMoving).toBe(false);
  });

  it('requests no frames at all while nothing moves', async () => {
    await mountCursor();

    const requested = await countRequestedFrames(async () => {
      await quiet(4);
    });

    expect(requested).toBe(0);
  });

  it('releases the frame loop when the element leaves the DOM mid-flight', async () => {
    const { root, instance } = await mountCursor();

    movePointer(document, 300, 300);
    await settle();
    expect(instance.motion.isMoving).toBe(true);

    root.remove();
    await settle();

    expect(instance.motion.isMoving).toBe(false);
  });

  it('resets its state when the component mounts again', async () => {
    const { root, el, instance } = await mountCursor();
    movePointer(document, 90, 90);
    await waitFor(() => !instance.motion.isMoving);
    expect(published(el)).toEqual(['90px', '90px']);

    const other = document.createElement('section');
    document.body.append(other);
    other.append(el);
    await settle();

    const moved = getInstance<Cursor>(other.firstElementChild as HTMLElement, 'Cursor')!;
    expect(published(moved.$el as HTMLElement)).toEqual(['0px', '0px']);
    expect((moved.$el as HTMLElement).style.translate).toBe('0px');
    root.remove();
  });
});

describe('Cursor — published state', () => {
  it('publishes an empty state before the pointer is over anything', async () => {
    const { el } = await mountCursor(`data-option-states='${STATES}'`);

    // Present, not absent: a channel that disappears is one a stylesheet has
    // to test for existence before it can style around it.
    expect(el.dataset.cursorState).toBe('');
  });

  it('resolves the state from the `states` map', async () => {
    const { root, el } = await mountCursor(
      `data-option-states='${STATES}'`,
      '<a href="#x" id="link" style="display:block;width:10px;height:10px"></a>',
    );
    const link = root.querySelector('#link')!;

    movePointer(link, 5, 5);
    await waitFor(() => el.dataset.cursorState === 'grow');

    expect(el.dataset.cursorState).toBe('grow');
  });

  it('matches an ancestor, so a selector needs no `a *` companion', async () => {
    const { root, el } = await mountCursor(
      `data-option-states='${STATES}'`,
      '<a href="#x" style="display:block"><span id="inner">label</span></a>',
    );
    const inner = root.querySelector('#inner')!;

    movePointer(inner, 5, 5);
    await waitFor(() => el.dataset.cursorState === 'grow');

    expect(el.dataset.cursorState).toBe('grow');
  });

  it('clears the state when the pointer leaves the matched element', async () => {
    const { root, el } = await mountCursor(
      `data-option-states='${STATES}'`,
      '<a href="#x" id="link" style="display:block"></a><span id="plain"></span>',
    );

    movePointer(root.querySelector('#link')!, 5, 5);
    await waitFor(() => el.dataset.cursorState === 'grow');

    movePointer(root.querySelector('#plain')!, 40, 40);
    await waitFor(() => el.dataset.cursorState === '');

    expect(el.dataset.cursorState).toBe('');
  });

  it('takes any number of author-named states', async () => {
    const states = '{"[data-a]": "alpha", "[data-b]": "beta", "[data-c]": "gamma"}';
    const { root, el } = await mountCursor(
      `data-option-states='${states}'`,
      '<i data-a id="a"></i><i data-b id="b"></i><i data-c id="c"></i>',
    );

    for (const [id, name] of [
      ['#a', 'alpha'],
      ['#b', 'beta'],
      ['#c', 'gamma'],
    ]) {
      movePointer(root.querySelector(id)!, 1, 1);
      await waitFor(() => el.dataset.cursorState === name);
      expect(el.dataset.cursorState).toBe(name);
    }
  });

  it('takes the first matching entry, in declaration order', async () => {
    const { root, el } = await mountCursor(
      `data-option-states='{"a": "first", "[data-both]": "second"}'`,
      '<a href="#x" data-both id="both"></a>',
    );

    movePointer(root.querySelector('#both')!, 1, 1);
    await waitFor(() => el.dataset.cursorState === 'first');

    expect(el.dataset.cursorState).toBe('first');
  });

  it('publishes no state at all when the map is empty', async () => {
    const { root, el } = await mountCursor('', '<a href="#x" id="link"></a>');

    movePointer(root.querySelector('#link')!, 1, 1);
    await quiet();

    expect(el.dataset.cursorState).toBe('');
  });

  it('reports an invalid selector once and keeps the other entries working', async () => {
    const log = captureDiagnostics();
    const { root, el } = await mountCursor(
      `data-option-states='{"::::": "broken", "[data-cursor-shrink]": "shrink"}'`,
      '<i data-cursor-shrink id="target"></i>',
    );
    const target = root.querySelector('#target')!;

    movePointer(target, 1, 1);
    await waitFor(() => el.dataset.cursorState === 'shrink');
    movePointer(target, 2, 2);
    movePointer(target, 3, 3);
    await quiet();
    log.stop();

    expect(el.dataset.cursorState).toBe('shrink');
    expect(log.codes.filter((code) => code === 'cursor.invalid-selector')).toHaveLength(1);
  });
});

describe('Cursor — pointer down', () => {
  it('publishes `data-cursor-down` while the button is down', async () => {
    const { el } = await mountCursor(`data-option-states='${STATES}'`);

    expect(el.dataset.cursorDown).toBeUndefined();

    pressPointer(document.body, 40, 40);
    movePointer(document.body, 41, 41, 1);
    await waitFor(() => el.dataset.cursorDown === '');

    expect(el.dataset.cursorDown).toBe('');

    releasePointer();
    movePointer(document.body, 42, 42);
    await waitFor(() => el.dataset.cursorDown === undefined);

    expect(el.dataset.cursorDown).toBeUndefined();
  });

  it('keeps the state a press happens over, instead of overriding it', async () => {
    const { root, el } = await mountCursor(
      `data-option-states='${STATES}'`,
      '<a href="#x" id="link" style="display:block"></a>',
    );
    const link = root.querySelector('#link')!;

    movePointer(link, 5, 5);
    await waitFor(() => el.dataset.cursorState === 'grow');

    pressPointer(link, 5, 5);
    movePointer(link, 6, 6, 1);
    await waitFor(() => el.dataset.cursorDown === '');

    // The two facts are orthogonal, so the cascade — not the component —
    // decides what a press over a growing element looks like.
    expect(el.dataset.cursorState).toBe('grow');
    expect(el.dataset.cursorDown).toBe('');
  });

  it('leaves `down` free as a state name', async () => {
    const { root, el } = await mountCursor(
      `data-option-states='{"[data-cursor-shrink]": "down"}'`,
      '<i data-cursor-shrink id="target"></i>',
    );

    movePointer(root.querySelector('#target')!, 1, 1);
    await waitFor(() => el.dataset.cursorState === 'down');

    expect(el.dataset.cursorState).toBe('down');
    expect(el.dataset.cursorDown).toBeUndefined();
  });
});

describe('Cursor — CSS drives the visual', () => {
  it('scales from a stylesheet without moving the cursor off the pointer', async () => {
    const style = document.createElement('style');
    style.textContent = `[data-cursor-state='grow'] { scale: 2 }`;
    document.head.append(style);

    const { root, el, instance } = await mountCursor(
      `data-option-states='${STATES}'`,
      '<a href="#x" id="link" style="display:block;width:10px;height:10px"></a>',
    );

    movePointer(root.querySelector('#link')!, 100, 60);
    await waitFor(() => el.dataset.cursorState === 'grow');
    await waitFor(() => !instance.motion.isMoving);

    expect(getComputedStyle(el).scale).toBe('2');
    // The position is written into `translate`, which the cascade composes
    // *outside* the scale: a cursor at scale 2 is still on the pointer.
    expect(el.style.translate).toBe('100px 60px');
    // The 20px box starts centred on 10, so a translation of 100 outside the
    // scale puts the centre at 110. Had the position gone into `transform`,
    // the scale would have doubled it and landed the centre at 210.
    const box = el.getBoundingClientRect();
    expect(box.width).toBe(40);
    expect(box.left + box.width / 2).toBeCloseTo(110, 0);

    style.remove();
  });
});
