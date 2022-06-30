import { jest } from '@jest/globals';
import { Draggable } from '@studiometa/ui';
import wait from '../__utils__/wait.js';

describe('The Draggable component', () => {
  it('should move its root element', async () => {
    const div = document.createElement('div');
    const draggable = new Draggable(div);
    draggable.$mount();
    div.dispatchEvent(new MouseEvent('mousedown'));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
    await wait(16);
    expect(div.style.transform).toBe('matrix(1, 0, 0, 1, 10, 10)');
  });
});
