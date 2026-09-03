import { afterEach, describe, expect, it } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Carousel } from '#private/Carousel/Carousel.js';
import { CarouselCount } from '#private/Carousel/CarouselCount.js';
import { CarouselItem } from '#private/Carousel/CarouselItem.js';
import { CarouselWrapper } from '#private/Carousel/CarouselWrapper.js';

registerComponents(Carousel, CarouselCount, CarouselItem, CarouselWrapper);

afterEach(resetDom);

const WRAPPER_STYLE =
  'display:flex;overflow:auto;width:200px;height:100px;scroll-snap-type:x mandatory';
const ITEM_STYLE = 'flex:0 0 200px;width:200px;height:100px';

interface Rendered {
  el: HTMLElement;
  carousel: Carousel;
  count: CarouselCount;
  countEl: HTMLElement;
  current: HTMLElement | null;
  total: HTMLElement | null;
}

function slides(count: number): string {
  return Array.from(
    { length: count },
    () => `<div data-component="CarouselItem" style="${ITEM_STYLE}"></div>`,
  ).join('');
}

async function render({
  slideCount = 3,
  content = '<span data-ref="current"></span> / <span data-ref="total"></span>',
}: { slideCount?: number; content?: string } = {}): Promise<Rendered> {
  const root = document.createElement('div');
  root.innerHTML = `
    <div data-component="Carousel" aria-label="Featured products">
      <div data-component="CarouselWrapper" style="${WRAPPER_STYLE}">${slides(slideCount)}</div>
      <p data-component="CarouselCount">${content}</p>
    </div>`;
  document.body.append(root);
  await settle();

  const el = root.firstElementChild as HTMLElement;
  const countEl = el.querySelector('[data-component="CarouselCount"]') as HTMLElement;

  return {
    el,
    countEl,
    carousel: getInstance<Carousel>(el, 'Carousel')!,
    count: await waitFor(() => getInstance<CarouselCount>(countEl, 'CarouselCount')),
    current: countEl.querySelector('[data-ref="current"]'),
    total: countEl.querySelector('[data-ref="total"]'),
  };
}

async function quiet(times = 10): Promise<void> {
  for (let index = 0; index < times; index += 1) {
    await settle();
  }
}

describe('CarouselCount', () => {
  it('writes the one-based position and the slide count', async () => {
    const { current, total } = await render({ slideCount: 4 });

    // One-based: `index` is zero-based everywhere in the API, and a person
    // counting slides starts at one.
    expect(current?.textContent).toBe('1');
    expect(total?.textContent).toBe('4');
  });

  it('follows the carousel', async () => {
    const { carousel, current } = await render({ slideCount: 4 });

    await carousel.goTo(2);
    await waitFor(() => current?.textContent === '3', { timeout: 2000 });

    expect(current?.textContent).toBe('3');
  });

  it('follows the live slide count', async () => {
    const { el, total } = await render({ slideCount: 3 });
    expect(total?.textContent).toBe('3');

    const slide = document.createElement('div');
    slide.setAttribute('data-component', 'CarouselItem');
    slide.style.cssText = ITEM_STYLE;
    (el.querySelector('[data-component="CarouselWrapper"]') as HTMLElement).append(slide);
    await settle();

    await waitFor(() => total?.textContent === '4');
    expect(total?.textContent).toBe('4');
  });

  it('works with only a `total` ref', async () => {
    // The `current` ref is optional. Writing to it unguarded would throw on the
    // first state delivery and take the mount down with it, which is why the
    // mount flag is asserted next to the text.
    const { count, total } = await render({
      slideCount: 3,
      content: '<span data-ref="total"></span> slides',
    });

    expect(count.$isMounted).toBe(true);
    expect(total?.textContent).toBe('3');
  });

  it('works with only a `current` ref', async () => {
    const { carousel, count, current } = await render({
      slideCount: 3,
      content: 'Slide <span data-ref="current"></span>',
    });

    expect(count.$isMounted).toBe(true);
    expect(current?.textContent).toBe('1');

    await carousel.goTo(1);
    await waitFor(() => current?.textContent === '2', { timeout: 2000 });
    expect(current?.textContent).toBe('2');
  });

  it('reports the markup mistake that makes it do nothing', async () => {
    const log = captureDiagnostics();
    await render({ slideCount: 3, content: '<span>1 / 3</span>' });
    await quiet();
    log.stop();

    expect(log.codes).toContain('carousel-count.no-refs');
  });

  it('stays quiet when it has a ref to write into', async () => {
    const log = captureDiagnostics();
    await render({ slideCount: 3 });
    await quiet();
    log.stop();

    expect(log.codes).not.toContain('carousel-count.no-refs');
  });
});

describe('CarouselCount — mount order', () => {
  it('writes nothing while there is no carousel above it', async () => {
    const countEl = document.createElement('p');
    countEl.setAttribute('data-component', 'CarouselCount');
    countEl.innerHTML = '<span data-ref="current">—</span> / <span data-ref="total">—</span>';
    document.body.append(countEl);
    await settle();

    const count = await waitFor(() => getInstance<CarouselCount>(countEl, 'CarouselCount'));
    await quiet();

    expect(count.carousel).toBeUndefined();
    expect(countEl.querySelector('[data-ref="current"]')?.textContent).toBe('—');
    expect(countEl.querySelector('[data-ref="total"]')?.textContent).toBe('—');
  });

  it('fills in when the carousel arrives after it', async () => {
    const countEl = document.createElement('p');
    countEl.setAttribute('data-component', 'CarouselCount');
    countEl.innerHTML = '<span data-ref="current">—</span> / <span data-ref="total">—</span>';
    document.body.append(countEl);
    await settle();
    await waitFor(() => getInstance<CarouselCount>(countEl, 'CarouselCount'));

    const el = document.createElement('div');
    el.setAttribute('data-component', 'Carousel');
    el.setAttribute('aria-label', 'Featured products');
    el.innerHTML = `<div data-component="CarouselWrapper" style="${WRAPPER_STYLE}">${slides(5)}</div>`;
    document.body.append(el);
    el.append(countEl);
    await settle();

    await waitFor(() => countEl.querySelector('[data-ref="total"]')?.textContent === '5');
    expect(countEl.querySelector('[data-ref="current"]')?.textContent).toBe('1');
  });
});
