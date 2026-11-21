import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getInstance,
  registerComponents,
  type ElementPointerProps,
  type RafProps,
} from '@studiometa/js-toolkit';
import { resetDom, settle } from '@studiometa/js-toolkit/test';
import { Hoverable, type HoverableBounds } from '#private/Hoverable/Hoverable.js';

registerComponents(Hoverable);

afterEach(resetDom);

const PARENT = 'position:absolute;top:0;left:0;width:100px;height:100px';
const TARGET = 'position:absolute;top:10px;left:10px;width:20px;height:20px';

async function render(attributes = ''): Promise<{ el: HTMLElement; instance: Hoverable }> {
  const root = document.createElement('div');
  root.innerHTML = `
    <div data-component="Hoverable" style="${PARENT}" ${attributes}>
      <div data-ref="target" style="${TARGET}"></div>
    </div>`;
  document.body.append(root);
  await settle();
  const el = root.firstElementChild as HTMLElement;
  return { el, instance: getInstance<Hoverable>(el, 'Hoverable')! };
}

function progress(x: number, y: number): ElementPointerProps {
  return { relativeProgressX: x, relativeProgressY: y } as ElementPointerProps;
}

function stubBounds(
  instance: Hoverable,
  bounds: HoverableBounds = { xMin: 0, xMax: 100, yMin: 0, yMax: 100 },
): void {
  vi.spyOn(instance, 'bounds', 'get').mockReturnValue(bounds);
}

describe('Hoverable', () => {
  it('exposes `target` and `parent` getters', async () => {
    const { el, instance } = await render();
    expect(instance.target).toBe(el.querySelector('[data-ref="target"]'));
    expect(instance.parent).toBe(el);
  });

  it('computes bounds from the real target and parent boxes', async () => {
    const { instance } = await render();
    expect(instance.bounds).toEqual({ xMin: -10, yMin: -10, xMax: 70, yMax: 70 });
  });

  it('maps pointer progress into bounds, clamped to 0–1', async () => {
    const { instance } = await render();
    stubBounds(instance);

    instance.moved(progress(0, 0));
    expect(instance.props).toMatchObject({ x: 0, y: 0 });

    instance.moved(progress(0.5, 0.5));
    expect(instance.props).toMatchObject({ x: 50, y: 50 });

    instance.moved(progress(1, 1));
    expect(instance.props).toMatchObject({ x: 100, y: 100 });

    // Past the box, progress is clamped rather than extrapolated.
    instance.moved(progress(1.5, 1.5));
    expect(instance.props).toMatchObject({ x: 100, y: 100 });
  });

  it('reverses direction when `reversed` is set', async () => {
    const { instance } = await render('data-option-reversed="true"');
    stubBounds(instance);

    instance.moved(progress(0, 0));
    expect(instance.props).toMatchObject({ x: 100, y: 100 });

    instance.moved(progress(1, 1));
    expect(instance.props).toMatchObject({ x: 0, y: 0 });
  });

  it('stops updating once the pointer leaves the box when `contained` is set', async () => {
    const { instance } = await render('data-option-contained="true"');
    stubBounds(instance);

    instance.moved(progress(0, 0));
    expect(instance.props).toMatchObject({ x: 0, y: 0 });

    instance.moved(progress(0.5, 1.5));
    expect(instance.props).toMatchObject({ x: 0, y: 0 });
  });

  it('keeps the rectangular bounds by default', async () => {
    const { instance } = await render();
    expect(instance.$options.shape).toBe('rect');
    expect(instance.constrainPosition(-50, 150)).toEqual({ x: -50, y: 150 });
  });

  it('constrains the position to a circle inscribed in the bounds', async () => {
    const { instance } = await render('data-option-shape="circle"');
    stubBounds(instance);

    // A corner is brought back onto the circle, along the diagonal.
    instance.moved(progress(0, 0));
    expect(instance.props.x).toBeCloseTo(50 - 50 / Math.SQRT2);
    expect(instance.props.y).toBeCloseTo(50 - 50 / Math.SQRT2);

    // A position inside the circle is kept.
    instance.moved(progress(0.25, 0.5));
    expect(instance.props).toMatchObject({ x: 25, y: 50 });

    instance.moved(progress(0.5, 0.5));
    expect(instance.props).toMatchObject({ x: 50, y: 50 });
  });

  it('uses the smallest radius for a circle in non-square bounds', async () => {
    const { instance } = await render('data-option-shape="circle"');
    stubBounds(instance, { xMin: 0, xMax: 200, yMin: 0, yMax: 100 });

    instance.moved(progress(1, 0.5));
    expect(instance.props.x).toBeCloseTo(150);
    expect(instance.props.y).toBeCloseTo(50);
  });

  it('constrains the position to an ellipse inscribed in the bounds', async () => {
    const { instance } = await render('data-option-shape="ellipse"');
    stubBounds(instance, { xMin: 0, xMax: 200, yMin: 0, yMax: 100 });

    instance.moved(progress(0, 0));
    expect(instance.props.x).toBeCloseTo(100 - 100 / Math.SQRT2);
    expect(instance.props.y).toBeCloseTo(50 - 50 / Math.SQRT2);

    // The ends of the major axis are on the ellipse.
    instance.moved(progress(1, 0.5));
    expect(instance.props).toMatchObject({ x: 200, y: 50 });
  });

  it('supports inverted bounds, when the target is smaller than its parent', async () => {
    const { instance } = await render('data-option-shape="ellipse"');
    stubBounds(instance, { xMin: 40, xMax: -40, yMin: 20, yMax: -20 });

    instance.moved(progress(0, 0));
    expect(instance.props.x).toBeCloseTo(40 / Math.SQRT2);
    expect(instance.props.y).toBeCloseTo(20 / Math.SQRT2);

    instance.moved(progress(0.5, 0.5));
    expect(instance.props).toMatchObject({ x: 0, y: 0 });
  });

  it('keeps the target at the center when the bounds have no size', async () => {
    const { instance } = await render('data-option-shape="circle"');
    stubBounds(instance, { xMin: 10, xMax: 10, yMin: 0, yMax: 100 });

    instance.moved(progress(1, 1));
    expect(instance.props).toMatchObject({ x: 10, y: 50 });
  });

  it('applies the shape after the `reversed` option', async () => {
    const { instance } = await render('data-option-shape="circle" data-option-reversed="true"');
    stubBounds(instance);

    instance.moved(progress(0, 0));
    expect(instance.props.x).toBeCloseTo(50 + 50 / Math.SQRT2);
    expect(instance.props.y).toBeCloseTo(50 + 50 / Math.SQRT2);
  });

  it('lets a subclass override `constrainPosition`', async () => {
    const { instance } = await render();
    stubBounds(instance);
    vi.spyOn(instance, 'constrainPosition').mockImplementation((x) => ({ x, y: 0 }));

    instance.moved(progress(0.5, 0.5));
    expect(instance.constrainPosition).toHaveBeenCalledWith(50, 50, {
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100,
    });
    expect(instance.props).toMatchObject({ x: 50, y: 0 });
  });

  it('damps toward the target position each frame and writes the transform', async () => {
    const { instance } = await render();
    stubBounds(instance);
    instance.moved(progress(0.5, 0.5));

    // A large elapsed time closes the gap past `damp()`'s snap precision.
    instance.ticked({ time: 0, delta: 5000 } as RafProps);
    await settle();

    expect(instance.target.style.transform).toBe('translate3d(50px, 50px, 0px)');
  });
});
