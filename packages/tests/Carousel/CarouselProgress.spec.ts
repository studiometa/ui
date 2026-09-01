import { afterEach, describe, expect, it } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Carousel } from '#private/Carousel/Carousel.js';
import { CarouselItem } from '#private/Carousel/CarouselItem.js';
import { CarouselProgress } from '#private/Carousel/CarouselProgress.js';
import { CarouselWrapper } from '#private/Carousel/CarouselWrapper.js';

registerComponents(Carousel, CarouselItem, CarouselProgress, CarouselWrapper);

afterEach(resetDom);

const HORIZONTAL_WRAPPER_STYLE = 'display:flex;overflow:auto;width:200px;height:100px';
const HORIZONTAL_ITEM_STYLE = 'flex:0 0 200px;width:200px;height:100px';
const VERTICAL_WRAPPER_STYLE = 'display:block;overflow:auto;width:200px;height:100px';
const VERTICAL_ITEM_STYLE = 'width:200px;height:100px';

interface Rendered {
  el: HTMLElement;
  carousel: Carousel;
  progress: CarouselProgress;
  progressEl: HTMLElement;
  wrapper: HTMLElement;
  bar: HTMLElement | null;
}

async function render({
  count = 3,
  vertical = false,
  content = '<span data-ref="progress" style="display:block;width:100%;height:4px"></span>',
}: { count?: number; vertical?: boolean; content?: string } = {}): Promise<Rendered> {
  const itemStyle = vertical ? VERTICAL_ITEM_STYLE : HORIZONTAL_ITEM_STYLE;
  const slides = Array.from(
    { length: count },
    () => `<div data-component="CarouselItem" style="${itemStyle}"></div>`,
  ).join('');

  const root = document.createElement('div');
  root.innerHTML = `
    <div data-component="Carousel" aria-label="Featured products" ${
      vertical ? 'data-option-axis="y"' : ''
    }>
      <div data-component="CarouselWrapper" style="${
        vertical ? VERTICAL_WRAPPER_STYLE : HORIZONTAL_WRAPPER_STYLE
      }">${slides}</div>
      <div data-component="CarouselProgress" style="overflow:hidden">${content}</div>
    </div>`;
  document.body.append(root);
  await settle();

  const el = root.firstElementChild as HTMLElement;
  const progressEl = el.querySelector('[data-component="CarouselProgress"]') as HTMLElement;

  return {
    el,
    progressEl,
    carousel: getInstance<Carousel>(el, 'Carousel')!,
    progress: await waitFor(() => getInstance<CarouselProgress>(progressEl, 'CarouselProgress')),
    wrapper: el.querySelector('[data-component="CarouselWrapper"]') as HTMLElement,
    bar: progressEl.querySelector('[data-ref="progress"]'),
  };
}

async function quiet(times = 10): Promise<void> {
  for (let index = 0; index < times; index += 1) {
    await settle();
  }
}

/** The two percentage offsets the bar is translated by, `[x, y]`. */
function offsets(bar: HTMLElement | null): [number, number] {
  const match = /translate3d\(\s*([-\d.]+)%\s*,\s*([-\d.]+)%/.exec(bar?.style.transform ?? '');
  if (!match) {
    throw new Error(`No percentage translate on the bar, got "${bar?.style.transform ?? ''}"`);
  }
  return [Number(match[1]), Number(match[2])];
}

describe('CarouselProgress', () => {
  it('starts fully out of view', async () => {
    const { bar } = await render();

    expect(offsets(bar)).toEqual([-100, 0]);
  });

  it('ends fully in view at the end of the track', async () => {
    const { wrapper, bar } = await render({ count: 3 });

    wrapper.scrollLeft = wrapper.scrollWidth - wrapper.clientWidth;

    await waitFor(() => offsets(bar)[0] === 0, { timeout: 2000 });
    expect(offsets(bar)).toEqual([0, 0]);
  });

  it('follows the scroll offset, not the index', async () => {
    const { wrapper, bar } = await render({ count: 3 });
    // A 200px scroller over three 200px slides scrolls 400px in total.
    expect(wrapper.scrollWidth - wrapper.clientWidth).toBe(400);

    wrapper.scrollLeft = 100;
    await waitFor(() => offsets(bar)[0] > -100, { timeout: 2000 });
    const quarter = offsets(bar)[0];

    wrapper.scrollLeft = 150;
    await waitFor(() => offsets(bar)[0] !== quarter, { timeout: 2000 });
    const eighth = offsets(bar)[0];

    // Two offsets inside the first slide, and they differ: an index-derived
    // bar reports the same number for both, because the index has not changed.
    expect(quarter).toBeCloseTo(-75, 1);
    expect(eighth).toBeCloseTo(-62.5, 1);
  });

  it('translates on the vertical axis for a vertical carousel', async () => {
    const { wrapper, bar } = await render({ count: 3, vertical: true });

    expect(offsets(bar)).toEqual([0, -100]);

    wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
    await waitFor(() => offsets(bar)[1] === 0, { timeout: 2000 });

    expect(offsets(bar)).toEqual([0, 0]);
  });

  it('reports a bar it cannot find', async () => {
    const log = captureDiagnostics();
    await render({ content: '<span></span>' });
    await quiet();
    log.stop();

    expect(log.codes).toContain('carousel-progress.no-ref');
  });

  it('stays quiet when the bar is there', async () => {
    const log = captureDiagnostics();
    await render();
    await quiet();
    log.stop();

    expect(log.codes).not.toContain('carousel-progress.no-ref');
  });
});

describe('CarouselProgress — mount order', () => {
  it('does not move while there is no carousel above it', async () => {
    const progressEl = document.createElement('div');
    progressEl.setAttribute('data-component', 'CarouselProgress');
    progressEl.innerHTML = '<span data-ref="progress"></span>';
    document.body.append(progressEl);
    await settle();

    const progress = await waitFor(() =>
      getInstance<CarouselProgress>(progressEl, 'CarouselProgress'),
    );
    await quiet();

    expect(progress.carousel).toBeUndefined();
    expect((progressEl.querySelector('[data-ref="progress"]') as HTMLElement).style.transform).toBe(
      '',
    );
  });

  it('starts moving when the carousel arrives after it', async () => {
    const progressEl = document.createElement('div');
    progressEl.setAttribute('data-component', 'CarouselProgress');
    progressEl.innerHTML = '<span data-ref="progress"></span>';
    document.body.append(progressEl);
    await settle();
    await waitFor(() => getInstance<CarouselProgress>(progressEl, 'CarouselProgress'));

    const el = document.createElement('div');
    el.setAttribute('data-component', 'Carousel');
    el.setAttribute('aria-label', 'Featured products');
    el.innerHTML = `<div data-component="CarouselWrapper" style="${HORIZONTAL_WRAPPER_STYLE}">${Array.from(
      { length: 3 },
      () => `<div data-component="CarouselItem" style="${HORIZONTAL_ITEM_STYLE}"></div>`,
    ).join('')}</div>`;
    document.body.append(el);
    el.append(progressEl);
    await settle();

    const bar = progressEl.querySelector('[data-ref="progress"]') as HTMLElement;
    await waitFor(() => bar.style.transform !== '');

    expect(offsets(bar)).toEqual([-100, 0]);

    const wrapper = el.querySelector('[data-component="CarouselWrapper"]') as HTMLElement;
    wrapper.scrollLeft = wrapper.scrollWidth - wrapper.clientWidth;
    await waitFor(() => offsets(bar)[0] === 0, { timeout: 2000 });
    expect(offsets(bar)).toEqual([0, 0]);
  });
});
