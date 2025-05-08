import { describe, it, expect, vi } from 'vitest';
import { Draggable } from '@studiometa/ui';
import { h, mount, wait } from '#test-utils';

describe('The Draggable component', () => {
  it('should move its target ref', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', [target]);
    const draggable = new Draggable(div);
    await mount(draggable);
    draggable.x = 10;
    draggable.y = 10;
    while (draggable.dampedX !== draggable.x) {
      draggable.render();
    }
    await wait(1);
    expect(target.style.transform).toBe('translate3d(10px, 10px, 0px)');
  });
});
