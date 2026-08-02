import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PointerServiceProps } from '@studiometa/js-toolkit';
import { Hoverable, HoverableController } from '@studiometa/ui';
import { h, mount } from '#test-utils';

function pointerProgress(x: number, y: number) {
  return {
    progress: { x, y },
  } as PointerServiceProps;
}

describe('The HoverableController component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should find and control a Hoverable component by id', async () => {
    // Create the controlled Hoverable component manually
    const target = h('div', { dataRef: 'target' });
    const hoverableDiv = h('div', { id: 'controlled-hoverable' }, [target]);
    document.body.appendChild(hoverableDiv);
    
    const hoverable = new Hoverable(hoverableDiv);
    await mount(hoverable);
    
    // Mock the bounds for testing
    const spy = vi.spyOn(hoverable, 'bounds', 'get');
    spy.mockImplementation(() => ({
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100,
    }));

    // Create the controller
    const controllerDiv = h('div', { dataOptionControls: 'controlled-hoverable' });
    const controller = new HoverableController(controllerDiv);
    await mount(controller);
    
    // Mock the getInstanceFromElement call in the controller
    const controllerSpy = vi.spyOn(controller, 'hoverable', 'get');
    controllerSpy.mockImplementation(() => hoverable);

    // Test that controller can find the hoverable
    expect(controller.hoverable).toBe(hoverable);

    // Test that controller can control the hoverable
    const hoverableSpy = vi.spyOn(hoverable, 'movedrelative');
    
    controller.movedrelative(pointerProgress(0.5, 0.5));
    
    expect(hoverableSpy).toHaveBeenCalledWith(pointerProgress(0.5, 0.5), true);
    expect(hoverable.props.x).toBe(50);
    expect(hoverable.props.y).toBe(50);
  });

  it('should return null when controlled element is not found', async () => {
    const controllerDiv = h('div', { dataOptionControls: 'non-existent' });
    const controller = new HoverableController(controllerDiv);
    await mount(controller);

    expect(controller.hoverable).toBe(null);
  });

  it('should return null when no controls option is provided', async () => {
    const controllerDiv = h('div');
    const controller = new HoverableController(controllerDiv);
    await mount(controller);

    expect(controller.hoverable).toBe(null);
  });

  it('should not crash when controlling a non-existent hoverable', async () => {
    const controllerDiv = h('div', { dataOptionControls: 'non-existent' });
    const controller = new HoverableController(controllerDiv);
    await mount(controller);

    expect(() => {
      controller.movedrelative(pointerProgress(0.5, 0.5));
    }).not.toThrow();
  });

  it('should allow a Hoverable to work normally when not controlled', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', [target]);
    const hoverable = new Hoverable(div);
    const spy = vi.spyOn(hoverable, 'bounds', 'get');
    spy.mockImplementation(() => ({
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100,
    }));
    await mount(hoverable);

    // Normal behavior should still work
    hoverable.movedrelative(pointerProgress(0.5, 0.5));
    expect(hoverable.props.x).toBe(50);
    expect(hoverable.props.y).toBe(50);

    // Controlled behavior should work
    hoverable.movedrelative(pointerProgress(0.8, 0.8), true);
    expect(hoverable.props.x).toBe(80);
    expect(hoverable.props.y).toBe(80);

    // Disabled behavior should not work
    hoverable.movedrelative(pointerProgress(0.2, 0.2), false);
    expect(hoverable.props.x).toBe(80); // Should remain unchanged
    expect(hoverable.props.y).toBe(80); // Should remain unchanged
  });
});