import { afterEach, describe, expect, it } from 'vitest';
import {
  DRAG_MODES,
  getInstance,
  registerComponents,
  type DragProps,
} from '@studiometa/js-toolkit';
import { resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Carousel } from '#private/Carousel/Carousel.js';
import { CarouselDrag } from '#private/Carousel/CarouselDrag.js';
import { CarouselItem } from '#private/Carousel/CarouselItem.js';
import { CarouselWrapper } from '#private/Carousel/CarouselWrapper.js';

/**
 * `CarouselDrag` mounts on `media:(pointer: fine)`, which is the environment's
 * answer and not this file's — a suite that only ran where the query matched
 * would silently assert nothing anywhere else. The subclass changes the mount
 * strategy and nothing else, so every assertion below is about the real
 * component's behaviour.
 */
class EagerCarouselDrag extends CarouselDrag {
  static config = {
    name: 'EagerCarouselDrag',
    mountStrategy: 'eager' as const,
  };
}

registerComponents(Carousel, CarouselItem, CarouselWrapper, EagerCarouselDrag);

afterEach(async () => {
  release();
  await resetDom();
});

/** One slide per viewport, so one snap is exactly `SLIDE` pixels of scroll. */
const SLIDE = 200;
const WRAPPER_STYLE = `display:flex;overflow:auto;width:${SLIDE}px;height:100px;scroll-snap-type:x mandatory`;
const ITEM_STYLE = `flex:0 0 ${SLIDE}px;width:${SLIDE}px;height:100px;scroll-snap-align:center`;

interface Rendered {
  carousel: Carousel;
  drag: CarouselDrag;
  wrapper: HTMLElement;
}

async function render({ count = 6, attributes = '' } = {}): Promise<Rendered> {
  const root = document.createElement('div');
  root.innerHTML = `
    <div data-component="Carousel">
      <div data-component="CarouselWrapper EagerCarouselDrag" style="${WRAPPER_STYLE}" ${attributes}>
        ${Array.from(
          { length: count },
          () => `<div data-component="CarouselItem" style="${ITEM_STYLE}"></div>`,
        ).join('')}
      </div>
    </div>`;
  document.body.append(root);
  await settle();

  const el = root.firstElementChild as HTMLElement;
  const wrapper = el.querySelector('[data-component~="CarouselWrapper"]') as HTMLElement;
  const carousel = getInstance<Carousel>(el, 'Carousel')!;
  const drag = await waitFor(() => getInstance<CarouselDrag>(wrapper, 'EagerCarouselDrag'));

  await waitFor(() => carousel.positions.length === count);

  return { carousel, drag, wrapper };
}

/** Real pointer events, at the element the drag service listens on. */
function grab(el: HTMLElement, x: number): void {
  el.dispatchEvent(
    new PointerEvent('pointerdown', {
      button: 0,
      buttons: 1,
      clientX: x,
      clientY: 0,
      pointerType: 'mouse',
      bubbles: true,
    }),
  );
}

function move(x: number): void {
  document.dispatchEvent(
    new PointerEvent('pointermove', { buttons: 1, clientX: x, clientY: 0, pointerType: 'mouse' }),
  );
}

function release(): void {
  window.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'mouse' }));
}

/** A bounded quiet period, for the states asserted as unchanged. */
async function quiet(count = 12): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await settle();
  }
}

/**
 * A `drop` the drag service would publish, with the projected settle point set
 * explicitly.
 *
 * The velocity a synthetic pointer can reach is bounded — the service floors
 * its sample interval at half a frame, so a projection is at most a few times
 * the distance actually dragged — and the defect this pins is about the
 * unbounded case: a real flick on a real device projecting a screen and a half
 * ahead. Handing `__snap()` its props directly is the only way to state that
 * case, and it is the seam the pointer-driven tests below exercise for real.
 */
function drop(x: number, projectedTravel: number): DragProps {
  return {
    mode: DRAG_MODES.DROP,
    x,
    y: 0,
    deltaX: 0,
    deltaY: 0,
    originX: x,
    originY: 0,
    distanceX: 0,
    distanceY: 0,
    // The track travels against the pointer, so a positive scroll projection is
    // a negative pointer one.
    finalX: x - projectedTravel,
    finalY: 0,
  };
}

describe('CarouselDrag — the throw', () => {
  it('runs the throw as far as its projection says', async () => {
    const { drag, wrapper } = await render({ count: 6 });

    // 2000px of projected travel is ten slides, so the throw runs to the end
    // of the track. Crossing many slides on one hard flick is the inertia the
    // component is meant to have, not a defect to clamp away.
    drag.__snap(wrapper, drop(500, 2000));
    await waitFor(() => wrapper.scrollLeft === 5 * SLIDE, { timeout: 2000 });

    expect(wrapper.scrollLeft).toBe(5 * SLIDE);
  });

  it('runs backwards the same way', async () => {
    const { carousel, drag, wrapper } = await render({ count: 6 });
    await carousel.goTo(4);
    await waitFor(() => wrapper.scrollLeft === 4 * SLIDE, { timeout: 2000 });

    drag.__snap(wrapper, drop(500, -2000));
    await waitFor(() => wrapper.scrollLeft === 0, { timeout: 2000 });

    expect(wrapper.scrollLeft).toBe(0);
  });

  it('lands on the slide it is over when the throw barely moves', async () => {
    const { carousel, drag, wrapper } = await render({ count: 6 });
    await carousel.goTo(2);
    await waitFor(() => wrapper.scrollLeft === 2 * SLIDE, { timeout: 2000 });

    // 40px of projection does not reach the next slide, so the closest snap to
    // where it was heading is the one it is already on.
    drag.__snap(wrapper, drop(500, 40));
    await quiet();

    expect(wrapper.scrollLeft).toBe(2 * SLIDE);
  });

  it('advances on a real flick, through the whole pointer path', async () => {
    const { carousel, wrapper } = await render({ count: 6 });

    // A short, fast gesture: 96px of travel, most of it in the last event, so
    // the service's velocity smoothing projects past the slide it is on. This
    // is the seam the synthetic `drop()` cases above skip — the pointer, the
    // drag service and `__snap()` end to end.
    grab(wrapper, 300);
    move(280);
    move(204);
    release();

    // Two slides, not one: 96px of drag projects about 400px of scroll, and
    // the throw is allowed to run there. A clamp would stop it at one and turn
    // the gesture into a step.
    await waitFor(() => wrapper.scrollLeft === 2 * SLIDE, { timeout: 2000 });
    await waitFor(() => carousel.currentIndex === 2);

    expect(wrapper.scrollLeft).toBe(2 * SLIDE);
    expect(carousel.currentIndex).toBe(2);
  });
});

describe('CarouselDrag — the snapping restore', () => {
  it('leaves snapping enabled when the drag ends where it started', async () => {
    const { wrapper } = await render({ count: 6 });

    // Dragging backwards from the first slide: the track is already at zero, so
    // no `scroll` fires and — per CSSOM View — no `scrollend` ever will. The
    // settle has nothing to scroll to either, and this is the gesture that used
    // to leave the track with `scroll-snap-type: none` for good.
    grab(wrapper, 100);
    move(110);
    move(120);
    release();
    await quiet();

    expect(wrapper.scrollLeft).toBe(0);
    expect(wrapper.style.scrollSnapType).toBe('');
  });

  it('leaves snapping enabled once a settle has finished', async () => {
    const { wrapper } = await render({ count: 6 });

    grab(wrapper, 300);
    move(280);
    move(204);
    expect(wrapper.style.scrollSnapType).toBe('none');

    release();
    await waitFor(() => wrapper.scrollLeft === 2 * SLIDE, { timeout: 2000 });
    await waitFor(() => wrapper.style.scrollSnapType === '', { timeout: 2000 });

    expect(wrapper.style.scrollSnapType).toBe('');
  });

  it('leaves snapping enabled when the carousel has no slide to snap to', async () => {
    const { drag, wrapper } = await render({ count: 0 });

    wrapper.style.scrollSnapType = 'none';
    drag.__snap(wrapper, drop(500, 2000));

    expect(wrapper.style.scrollSnapType).toBe('');
  });

  it('leaves snapping enabled when the track unmounts mid-gesture', async () => {
    const { drag, wrapper } = await render({ count: 6 });

    grab(wrapper, 300);
    move(250);
    expect(wrapper.style.scrollSnapType).toBe('none');

    drag.$unmount();
    await settle();

    expect(wrapper.style.scrollSnapType).toBe('');
  });
});
