import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Cursor } from '@studiometa/ui';
import { wait } from '#test-utils';

/**
 * @typedef {import('@studiometa/ui/Cursor/Cursor.js').CursorInterface} CursorInterface
 */

const root = document.createElement('div');
/** @type {Cursor & CursorInterface} */
const cursor = new Cursor(root);
cursor.$options.translateDampFactor = 1;
cursor.$options.growDampFactor = 1;
cursor.$options.shrinkDampFactor = 1;

/**
 * @param {Object} options
 * @param {Object} [options.event]
 * @param {Number} options.x
 * @param {Number} options.y
 */
function moveMouse({ event = { target: document }, x, y }) {
  cursor.moved({ event, x, y });
  return new Promise((resolve) => setTimeout(resolve));
}

describe('The Cursor component', () => {
  let renderSpy;

  beforeEach(() => {
    renderSpy = jest.spyOn(cursor, 'render');
  });

  afterEach(() => {
    renderSpy.mockReset();
  });

  it('should render on mount', () => {
    cursor.$mount();
    expect(renderSpy).toHaveBeenLastCalledWith({ x: 0, y: 0, scale: 0 });
  });

  it('should render on mousemove', async () => {
    moveMouse({ x: 100, y: 100 });
    await wait(16);
    expect(renderSpy).toHaveBeenLastCalledWith({
      x: 100,
      y: 100,
      scale: 1,
    });
  });

  it('should disable the `ticked` service when not moving', async () => {
    const serviceSpy = jest.spyOn(cursor.$services, 'disable');
    moveMouse({ x: 100, y: 100 });
    await wait(16);
    expect(serviceSpy).toHaveBeenNthCalledWith(1, 'ticked');
  });

  it('should grow when hovering on grow selectors', async () => {
    const div = document.createElement('div');
    div.setAttribute('data-cursor-grow', '');
    moveMouse({ x: 100, y: 100, event: { target: div } });
    await wait(16);
    expect(renderSpy).toHaveBeenCalledWith({
      x: 100,
      y: 100,
      scale: 2,
    });
  });

  it('should shrink when hovering on shrink selectors', async () => {
    const div = document.createElement('div');
    div.setAttribute('data-cursor-shrink', '');
    moveMouse({ x: 100, y: 100, event: { target: div } });
    await wait(16);

    expect(renderSpy).toHaveBeenCalledWith({
      x: 100,
      y: 100,
      scale: 0.5,
    });
  });

  it('should scale back to the original size when hovering on nothing', async () => {
    moveMouse({ event: null, x: 100, y: 100 });
    await wait(16);

    expect(renderSpy).toHaveBeenCalledWith({
      x: 100,
      y: 100,
      scale: 1,
    });
  });
});
