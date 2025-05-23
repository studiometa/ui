import { describe, it, expect, vi } from 'vitest';
import type { PointerServiceProps } from '@studiometa/js-toolkit';
import { Hoverable } from '@studiometa/ui';
import { h, mount, wait } from '#test-utils';

function pointerProgress(x: number, y: number) {
  return {
    progress: { x, y },
  } as PointerServiceProps;
}

describe('The Hoverable component', () => {
  it('should have target and parent getters', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', [target]);
    const hoverable = new Hoverable(div);
    await mount(hoverable);
    expect(hoverable.target).toBe(target);
    expect(hoverable.parent).toBe(div);
  });

  it('should keep x and y in bounds', async () => {
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

    hoverable.movedrelative(pointerProgress(0, 0));
    expect(hoverable.props.x).toBe(0);
    expect(hoverable.props.y).toBe(0);
    hoverable.movedrelative(pointerProgress(0.5, 0.5));
    expect(hoverable.props.x).toBe(50);
    expect(hoverable.props.y).toBe(50);
    hoverable.movedrelative(pointerProgress(1, 1));
    expect(hoverable.props.x).toBe(100);
    expect(hoverable.props.y).toBe(100);
    hoverable.movedrelative(pointerProgress(1.5, 1.5));
    expect(hoverable.props.x).toBe(100);
    expect(hoverable.props.y).toBe(100);
  });

  it('should reverse x and y position when reversed option is used', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', { dataOptionReversed: true }, [target]);
    const hoverable = new Hoverable(div);
    const spy = vi.spyOn(hoverable, 'bounds', 'get');
    spy.mockImplementation(() => ({
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100,
    }));
    await mount(hoverable);

    hoverable.movedrelative(pointerProgress(0, 0));
    expect(hoverable.props.x).toBe(100);
    expect(hoverable.props.y).toBe(100);
    hoverable.movedrelative(pointerProgress(0.5, 0.5));
    expect(hoverable.props.x).toBe(50);
    expect(hoverable.props.y).toBe(50);
    hoverable.movedrelative(pointerProgress(1, 1));
    expect(hoverable.props.x).toBe(0);
    expect(hoverable.props.y).toBe(0);
    hoverable.movedrelative(pointerProgress(1.5, 1.5));
    expect(hoverable.props.x).toBe(0);
    expect(hoverable.props.y).toBe(0);
  });

  it('should stop update x and y position when contained option is used and mouse position is out of bounds', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', { dataOptionContained: true }, [target]);
    const hoverable = new Hoverable(div);
    const spy = vi.spyOn(hoverable, 'bounds', 'get');
    spy.mockImplementation(() => ({
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100,
    }));
    await mount(hoverable);

    hoverable.movedrelative(pointerProgress(0, 0));
    expect(hoverable.props.x).toBe(0);
    expect(hoverable.props.y).toBe(0);
    hoverable.movedrelative(pointerProgress(0.5, 1.5));
    expect(hoverable.props.x).toBe(0);
    expect(hoverable.props.y).toBe(0);
  });

  it('should correctly calculate bounds', async () => {
    const target = h('div', { dataRef: 'target' });
    const div = h('div', [target]);

    const hoverable = new Hoverable(div);
    await mount(hoverable);

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
      const mock = vi.spyOn(hoverable.parent, name, 'get');
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
      const mock = vi.spyOn(hoverable.target, name, 'get');
      mock.mockImplementation(() => value);
      targetSpies[name] = mock;
    }

    // @ts-expect-error
    hoverable.target.offsetParent = div;

    expect(hoverable.bounds.xMin).toBe(-10);
    expect(hoverable.bounds.yMin).toBe(-10);
    expect(hoverable.bounds.xMax).toBe(80);
    expect(hoverable.bounds.yMax).toBe(80);

    // @ts-expect-error
    hoverable.target.offsetParent = document.body;

    expect(hoverable.bounds.xMin).toBe(-10);
    expect(hoverable.bounds.yMin).toBe(-10);
    expect(hoverable.bounds.xMax).toBe(80);
    expect(hoverable.bounds.yMax).toBe(80);
  });
});
