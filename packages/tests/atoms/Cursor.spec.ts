import { describe, it, expect, vi } from 'vitest';
import { Cursor } from '@studiometa/ui';

async function getContext() {
  const root = document.createElement('div');
  const cursor = new Cursor(root);
  const renderSpy = vi.spyOn(cursor, 'render');
  vi.useFakeTimers();
  cursor.$mount();
  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();
  cursor.$options.translateDampFactor = 1;
  cursor.$options.growDampFactor = 1;
  cursor.$options.shrinkDampFactor = 1;

  async function moveMouse({ event = { target: document }, x, y }) {
    vi.useFakeTimers();
    cursor.moved({ event, x, y });
    await vi.advanceTimersByTimeAsync(16);
    vi.useRealTimers();
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
    const serviceSpy = vi.spyOn(cursor.$services, 'disable');
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
