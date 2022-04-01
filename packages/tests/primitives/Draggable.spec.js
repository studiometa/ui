import { jest } from '@jest/globals';
import { Draggable } from '@studiometa/ui';

describe('The Draggable component', () => {
  it('should move its root element', () => {
    const div = document.createElement('div');
    const draggable = new Draggable(div);
    draggable.$mount();
    jest.useFakeTimers();
    div.dispatchEvent(new MouseEvent('mousedown'));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
    jest.runAllTimers();
    expect(div.style.transform).toBe(
      'matrix(1, 0, 0, 1, -3336.0587899333364, -2482.8804530579046)'
    );
  });
});
