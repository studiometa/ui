import { describe, it, expect, vi } from 'vitest';
import { Draggable } from '@studiometa/ui';

function createEvent(type, data = {}, options = {}) {
  const event = new Event(type, options);
  Object.entries(data).forEach(([name, value]) => {
    event[name] = value;
  });

  return event;
}

describe('The Draggable component', () => {
  it('should move its root element', async () => {
    const div = document.createElement('div');
    const draggable = new Draggable(div);
    vi.useFakeTimers();
    draggable.$mount();
    await vi.advanceTimersByTimeAsync(100);
    div.dispatchEvent(createEvent('pointerdown', { x: 0, y: 0, button: 0 }));
    document.dispatchEvent(createEvent('mousemove', { clientX: 10, clientY: 10 }));
    await vi.advanceTimersByTimeAsync(16);
    expect(div.style.transform).toBe('matrix(1, 0, 0, 1, 10, 10)');
    vi.useRealTimers();
  });
});
