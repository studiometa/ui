import { describe, it, expect, jest } from '@jest/globals';
import { Cursor } from '@studiometa/ui';
import { wait } from '#test-utils';

async function getContext() {
  const root = document.createElement('div');
  const cursor = new Cursor(root);
  const renderSpy = jest.spyOn(cursor, 'render');
  jest.useFakeTimers();
  cursor.$mount();
  await jest.advanceTimersByTimeAsync(100);
  jest.useRealTimers();
  cursor.$options.translateDampFactor = 1;
  cursor.$options.growDampFactor = 1;
  cursor.$options.shrinkDampFactor = 1;

  async function moveMouse({ event = { target: document }, x, y }) {
    jest.useFakeTimers();
    cursor.moved({ event, x, y });
    await jest.advanceTimersByTimeAsync(16);
    jest.useRealTimers();
  }

  return {
    root,
    cursor,
    Cursor,
    moveMouse,
    renderSpy,
  };
}

describe('The Cursor component', () => {
  it('should render on mount', async () => {
    const { renderSpy } = await getContext();
    expect(renderSpy).toHaveBeenLastCalledWith({ x: 0, y: 0, scale: 0 });
  });

  it('should render on mousemove', async () => {
    const { moveMouse, renderSpy } = await getContext();
    await moveMouse({ x: 100, y: 100 });
    expect(renderSpy).toHaveBeenLastCalledWith({
      x: 100,
      y: 100,
      scale: 1,
    });
  });

  it('should disable the `ticked` service when not moving', async () => {
    const { moveMouse, cursor } = await getContext();
    const serviceSpy = jest.spyOn(cursor.$services, 'disable');
    await moveMouse({ x: 100, y: 100 });
    expect(serviceSpy).toHaveBeenNthCalledWith(1, 'ticked');
  });

  it('should grow when hovering on grow selectors', async () => {
    const { renderSpy, moveMouse } = await getContext();
    const div = document.createElement('div');
    div.setAttribute('data-cursor-grow', '');
    await moveMouse({ x: 100, y: 100, event: { target: div } });
    expect(renderSpy).toHaveBeenCalledWith({
      x: 100,
      y: 100,
      scale: 2,
    });
  });

  it('should shrink when hovering on shrink selectors', async () => {
    const { renderSpy, moveMouse } = await getContext();
    const div = document.createElement('div');
    div.setAttribute('data-cursor-shrink', '');
    await moveMouse({ x: 100, y: 100, event: { target: div } });

    expect(renderSpy).toHaveBeenCalledWith({
      x: 100,
      y: 100,
      scale: 0.5,
    });
  });

  it('should scale back to the original size when hovering on nothing', async () => {
    const { renderSpy, moveMouse } = await getContext();
    await moveMouse({ event: null, x: 100, y: 100 });

    expect(renderSpy).toHaveBeenCalledWith({
      x: 100,
      y: 100,
      scale: 1,
    });
  });
});
