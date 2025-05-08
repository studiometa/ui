import { describe, it, expect, vi } from 'vitest';
import { Draggable } from '@studiometa/ui';
import { h, mount, wait } from '#test-utils';
import { DragService } from '@studiometa/js-toolkit';

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

  it('should respect fitBounds option', async () => {
    const target = h('div', { dataRef: 'target', style: 'width: 100px; height: 100px;' });
    const div = h('div', {
      'data-option-fit-bounds': true,
      style: 'width: 200px; height: 200px;'
    }, [target]);
    const draggable = new Draggable(div);
    await mount(draggable);
    
    // Try to move beyond bounds
    draggable.x = 150;
    draggable.y = 150;

    // Trigger DROP mode to apply bounds clamping
    draggable.dragged({
      mode: DragService.MODES.DROP,
      target: draggable.target,
      isGrabbing: true,
      hasInertia: false,
      delta: { x: 0, y: 0 },
      origin: { x: 0, y: 0 },
      distance: { x: 0, y: 0 },
      final: { x: 0, y: 0 },
      x: 150,
      y: 150,
    });

    // Wait for damped values to match
    while (draggable.dampedX !== draggable.x || draggable.dampedY !== draggable.y) {
      draggable.render();
    }
    await wait(1);
    
    // Should be clamped to bounds
    expect(draggable.x).toBe(100); // 200px container - 100px target = 100px max
    expect(draggable.y).toBe(100);
  });

  it('should handle drag service modes correctly', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', [target]);
    const draggable = new Draggable(div);
    await mount(draggable);

    const baseProps = {
      target: draggable.target,
      isGrabbing: true,
      hasInertia: false,
      delta: { x: 0, y: 0 },
      origin: { x: 0, y: 0 },
      distance: { x: 0, y: 0 },
      final: { x: 0, y: 0 },
    };

    // Test START mode
    draggable.dragged({ ...baseProps, mode: DragService.MODES.START, x: 0, y: 0 });
    expect(draggable.originX).toBe(0);
    expect(draggable.originY).toBe(0);
    expect(draggable.dampFactor).toBe(draggable.$options.sensitivity);

    // Test DRAG mode
    draggable.dragged({ ...baseProps, mode: DragService.MODES.DRAG, x: 50, y: 50 });
    expect(draggable.x).toBe(50);
    expect(draggable.y).toBe(50);

    // Test DROP mode with fitBounds
    draggable.$options.fitBounds = true;
    draggable.dragged({ ...baseProps, mode: DragService.MODES.DROP, x: 100, y: 100 });
    expect(draggable.dampFactor).toBe(draggable.$options.dropSensitivity);
  });

  it('should handle ticked service correctly', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', [target]);
    const draggable = new Draggable(div);
    await mount(draggable);

    // Mock services
    const enableSpy = vi.spyOn(draggable.$services, 'enable');
    const disableSpy = vi.spyOn(draggable.$services, 'disable');

    // Initial state
    draggable.x = 100;
    draggable.y = 100;
    draggable.dampedX = 0;
    draggable.dampedY = 0;

    // First tick
    draggable.ticked();
    expect(enableSpy).not.toHaveBeenCalled();
    expect(disableSpy).not.toHaveBeenCalled();

    // When damped values match target values
    draggable.dampedX = 100;
    draggable.dampedY = 100;
    draggable.ticked();
    expect(disableSpy).toHaveBeenCalledWith('ticked');
  });

  it('should handle different sensitivity values', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', {
      'data-option-sensitivity': 0.8,
      'data-option-drop-sensitivity': 0.2,
    }, [target]);
    const draggable = new Draggable(div);
    await mount(draggable);

    // Wait for component to be fully initialized
    await wait(1);

    expect(draggable.$options.sensitivity).toBe(0.8);
    expect(draggable.$options.dropSensitivity).toBe(0.2);
  });

  it('should correctly calculate bounds', async () => {
    // Create a container to hold our test elements
    const container = h('div', { style: 'position: relative; width: 500px; height: 500px;' });
    document.body.appendChild(container);

    const target = h('div', {
      dataRef: 'target',
      style: 'width: 100px; height: 100px; position: absolute; top: 50px; left: 50px;'
    });
    const div = h('div', {
      style: 'width: 200px; height: 200px; position: relative;'
    }, [target]);

    // Add elements to the container
    container.appendChild(div);

    const draggable = new Draggable(div);
    await mount(draggable);

    // Force layout calculation
    div.getBoundingClientRect();
    target.getBoundingClientRect();

    // Wait for component to be fully initialized and DOM to be ready
    await wait(1);

    const bounds = draggable.bounds;
    expect(bounds.xMin).toBe(50);
    expect(bounds.yMin).toBe(50);
    expect(bounds.xMax).toBe(-50); // 50 + 100 - 200
    expect(bounds.yMax).toBe(-50); // 50 + 100 - 200

    // Clean up
    document.body.removeChild(container);
  });
});
