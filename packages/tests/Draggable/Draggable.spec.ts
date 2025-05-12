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
    draggable.props.x = 10;
    draggable.props.y = 10;
    while (draggable.props.dampedX !== draggable.props.x) {
      draggable.render();
    }
    await wait(1);
    expect(target.style.transform).toBe('translate3d(10px, 10px, 0px)');

    draggable.$options.x = false;
    draggable.$options.y = false;
    draggable.props.x = 20;
    draggable.props.y = 20;
    while (draggable.props.dampedX !== draggable.props.x) {
      draggable.render();
    }
    await wait(1);
    expect(target.style.transform).toBe('translate3d(0px, 0px, 0px)');
  });

  it('should respect clamp x and y to the bounding limits', async () => {
    const target = h('div', { dataRef: 'target', style: 'width: 100px; height: 100px;' });
    const div = h('div', { dataOptionFitBounds: true }, [target]);
    const draggable = new Draggable(div);
    await mount(draggable);

    const spy = vi.spyOn(draggable, 'bounds', 'get');
    spy.mockImplementation(() => ({
      xMin: -100,
      xMax: 100,
      yMin: -100,
      yMax: 100,
    }));

    draggable.props.x = 200;
    draggable.props.y = 200;

    // @ts-expect-error
    draggable.dragged({
      mode: DragService.MODES.DROP,
      MODES: DragService.MODES,
      final: { x: 200, y: 200 },
      origin: { x: 0, y: 0 },
    });

    expect(draggable.props.x).toBe(100);
    expect(draggable.props.y).toBe(100);
  });

  it('should handle drag service modes correctly', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', [target]);
    const draggable = new Draggable(div);
    await mount(draggable);

    const fn = vi.fn();
    for (const event of Draggable.config.emits) {
      draggable.$on(event, ({ detail: [props] }: CustomEvent) => fn(event, props));
    }

    const dragProps = {
      target: draggable.target,
      MODES: DragService.MODES,
      isGrabbing: true,
      hasInertia: false,
      x: 0,
      y: 0,
      delta: { x: 0, y: 0 },
      origin: { x: 0, y: 0 },
      distance: { x: 0, y: 0 },
      final: { x: 0, y: 0 },
    };

    // Test START mode
    draggable.dragged({ ...dragProps, mode: DragService.MODES.START });
    expect(draggable.props.originX).toBe(draggable.props.x);
    expect(draggable.props.originY).toBe(draggable.props.y);
    expect(draggable.dampFactor).toBe(draggable.$options.sensitivity);
    expect(fn).toHaveBeenLastCalledWith('drag-start', draggable.props);

    // Test DRAG mode
    draggable.dragged({ ...dragProps, mode: DragService.MODES.DRAG, x: 50, y: 50 });
    expect(draggable.props.x).toBe(50);
    expect(draggable.props.y).toBe(50);
    expect(fn).toHaveBeenLastCalledWith('drag-drag', draggable.props);

    // Test INERTIA mode without fitBounds
    draggable.dragged({ ...dragProps, mode: DragService.MODES.INERTIA, x: 100, y: 100 });
    expect(draggable.props.x).toBe(100);
    expect(draggable.props.y).toBe(100);
    expect(fn).toHaveBeenLastCalledWith('drag-inertia', draggable.props);

    // Test DROP mode with fitBounds
    draggable.$options.fitBounds = true;
    draggable.dragged({ ...dragProps, mode: DragService.MODES.DROP, x: 100, y: 100 });
    expect(draggable.dampFactor).toBe(draggable.$options.dropSensitivity);
    expect(fn).toHaveBeenLastCalledWith('drag-drop', draggable.props);
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
    draggable.props.x = 100;
    draggable.props.y = 100;
    draggable.props.dampedX = 0;
    draggable.props.dampedY = 0;

    // First tick
    draggable.ticked();
    expect(enableSpy).not.toHaveBeenCalled();
    expect(disableSpy).not.toHaveBeenCalled();

    // When damped values match target values
    draggable.props.dampedX = 100;
    draggable.props.dampedY = 100;
    draggable.ticked();
    expect(disableSpy).toHaveBeenCalledWith('ticked');
  });

  it('should handle different sensitivity values', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h(
      'div',
      {
        dataOptionSensitivity: 0.8,
        dataOptionDropSensitivity: 0.2,
      },
      [target],
    );
    const draggable = new Draggable(div);
    await mount(draggable);
    expect(draggable.$options.sensitivity).toBe(0.8);
    expect(draggable.$options.dropSensitivity).toBe(0.2);
  });

  it('should correctly calculate bounds', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', [target]);

    const draggable = new Draggable(div);
    await mount(draggable);

    const parentSpies = {};
    const parentOffsets = {
      offsetTop: 0,
      offsetLeft: 0,
      offsetHeight: 100,
      offsetWidth: 100,
    };

    for (const [name, value] of Object.entries(parentOffsets) as [
      keyof typeof parentOffsets,
      number,
    ][]) {
      const mock = vi.spyOn(draggable.parent, name, 'get');
      mock.mockImplementation(() => value);
      parentSpies[name] = mock;
    }

    const targetSpies = {};
    const targetOffsets = {
      offsetTop: 10,
      offsetHeight: 10,
      offsetLeft: 10,
      offsetWidth: 10,
    };

    for (const [name, value] of Object.entries(targetOffsets) as [
      keyof typeof targetOffsets,
      number,
    ][]) {
      const mock = vi.spyOn(draggable.target, name, 'get');
      mock.mockImplementation(() => value);
      targetSpies[name] = mock;
    }

    // @ts-expect-error
    draggable.target.offsetParent = div;

    expect(draggable.bounds.xMin).toBe(-10);
    expect(draggable.bounds.yMin).toBe(-10);
    expect(draggable.bounds.xMax).toBe(80);
    expect(draggable.bounds.yMax).toBe(80);

    // @ts-expect-error
    draggable.target.offsetParent = document.body;

    expect(draggable.bounds.xMin).toBe(-10);
    expect(draggable.bounds.yMin).toBe(-10);
    expect(draggable.bounds.xMax).toBe(80);
    expect(draggable.bounds.yMax).toBe(80);
  });

  it('should initialize with x and y options', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', { dataOptionNoX: true, dataOptionNoY: true }, [target]);
    const draggable = new Draggable(div);
    await mount(draggable);

    draggable.props.x = 100;
    draggable.props.y = 100;

    // Wait for damped values to match
    while (
      draggable.props.dampedX !== draggable.props.x ||
      draggable.props.dampedY !== draggable.props.y
    ) {
      draggable.render();
    }
    await wait(1);

    expect(target.style.transform).toBe('translate3d(0px, 0px, 0px)');
  });
});
