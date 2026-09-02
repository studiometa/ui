import { afterEach, describe, expect, it } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Carousel } from '#private/Carousel/Carousel.js';
import { CarouselDots } from '#private/Carousel/CarouselDots.js';
import { CarouselItem } from '#private/Carousel/CarouselItem.js';
import { CarouselWrapper } from '#private/Carousel/CarouselWrapper.js';

registerComponents(Carousel, CarouselDots, CarouselItem, CarouselWrapper);

afterEach(resetDom);

const WRAPPER_STYLE =
  'display:flex;overflow:auto;width:200px;height:100px;scroll-snap-type:x mandatory';
const ITEM_STYLE = 'flex:0 0 200px;width:200px;height:100px';

interface RenderOptions {
  count?: number;
  /** Extra attributes on the carousel root. */
  attributes?: string;
  /** The inner markup of the dot at that index. */
  dotContent?: Record<number, string>;
  /** Extra attributes on the dot at that index. */
  dotAttributes?: Record<number, string>;
}

interface Rendered {
  el: HTMLElement;
  carousel: Carousel;
  dots: CarouselDots;
  dotsEl: HTMLElement;
  buttons: HTMLButtonElement[];
}

function slides(count: number): string {
  return Array.from(
    { length: count },
    () => `<div data-component="CarouselItem" style="${ITEM_STYLE}"></div>`,
  ).join('');
}

async function render({
  count = 3,
  attributes = '',
  dotContent = {},
  dotAttributes = {},
}: RenderOptions = {}): Promise<Rendered> {
  const buttons = Array.from(
    { length: count },
    (_, index) =>
      `<button type="button" data-ref="dots[]" ${dotAttributes[index] ?? ''}>${
        dotContent[index] ?? ''
      }</button>`,
  ).join('');

  const root = document.createElement('div');
  root.innerHTML = `
    <div data-component="Carousel" aria-label="Featured products" ${attributes}>
      <div data-component="CarouselWrapper" style="${WRAPPER_STYLE}">${slides(count)}</div>
      <div data-component="CarouselDots">${buttons}</div>
    </div>`;
  document.body.append(root);
  await settle();

  const el = root.firstElementChild as HTMLElement;
  const dotsEl = el.querySelector('[data-component="CarouselDots"]') as HTMLElement;

  return {
    el,
    dotsEl,
    carousel: getInstance<Carousel>(el, 'Carousel')!,
    dots: await waitFor(() => getInstance<CarouselDots>(dotsEl, 'CarouselDots')),
    buttons: [...dotsEl.querySelectorAll<HTMLButtonElement>('button')],
  };
}

/** A bounded quiet period, for the states asserted as unchanged. */
async function quiet(count = 10): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await settle();
  }
}

/** Which dots carry the current marker, in DOM order. */
function currentFlags(buttons: HTMLButtonElement[]): boolean[] {
  return buttons.map((button) => button.getAttribute('aria-current') === 'true');
}

describe('CarouselDots — naming', () => {
  it('names a dot after the slide it opens', async () => {
    const { buttons } = await render({ count: 3 });

    // The documented default template, `{index} of {total}`, one-based.
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      '1 of 3',
      '2 of 3',
      '3 of 3',
    ]);
  });

  it('translates through the carousel `slide-label` option', async () => {
    const { buttons } = await render({
      count: 3,
      attributes: 'data-option-slide-label="Diapositive {index} sur {total}"',
    });

    expect(buttons[1].getAttribute('aria-label')).toBe('Diapositive 2 sur 3');
  });

  it('never overwrites a name the author wrote', async () => {
    const { buttons } = await render({
      count: 3,
      dotAttributes: { 1: 'aria-label="Go to the red dress"' },
    });

    expect(buttons[1].getAttribute('aria-label')).toBe('Go to the red dress');
  });

  it('leaves a dot whose own text names it', async () => {
    const { buttons } = await render({ count: 3, dotContent: { 1: '<span>Two</span>' } });

    expect(buttons[1].hasAttribute('aria-label')).toBe(false);
  });

  it('names a dot whose only content is hidden from the accessibility tree', async () => {
    // The commonest dot in the wild: a bullet marked `aria-hidden`, whose
    // `textContent` is not empty but whose accessible name is.
    const { buttons } = await render({
      count: 3,
      dotContent: { 1: '<span aria-hidden="true">●</span>' },
    });

    expect(buttons[1].getAttribute('aria-label')).toBe('2 of 3');
  });

  it('every dot ends up with an accessible name', async () => {
    const { buttons } = await render({ count: 4 });

    for (const button of buttons) {
      const name = button.getAttribute('aria-label') ?? button.textContent?.trim();
      expect(name).toBeTruthy();
    }
  });

  it('rewrites the generated names when the slide count changes', async () => {
    const { el, buttons, dotsEl } = await render({ count: 3 });
    expect(buttons[0].getAttribute('aria-label')).toBe('1 of 3');

    const slide = document.createElement('div');
    slide.setAttribute('data-component', 'CarouselItem');
    slide.style.cssText = ITEM_STYLE;
    (el.querySelector('[data-component="CarouselWrapper"]') as HTMLElement).append(slide);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('data-ref', 'dots[]');
    dotsEl.append(dot);
    await settle();

    await waitFor(() => buttons[0].getAttribute('aria-label') === '1 of 4');
    expect(dot.getAttribute('aria-label')).toBe('4 of 4');
  });
});

describe('CarouselDots — the current marker', () => {
  it('marks the current dot with `aria-current`', async () => {
    const { buttons } = await render({ count: 3 });

    expect(currentFlags(buttons)).toEqual([true, false, false]);
  });

  it('moves the marker when the carousel moves', async () => {
    const { carousel, buttons } = await render({ count: 3 });

    await carousel.goTo(2);
    await waitFor(() => currentFlags(buttons)[2], { timeout: 2000 });

    expect(currentFlags(buttons)).toEqual([false, false, true]);
  });

  it('holds the marker on the destination for the whole scroll', async () => {
    const { carousel, buttons } = await render({ count: 5 });

    // Three slides away, so a smooth scroll passes two on the way. Reporting
    // the slide under the animation would light each one up in turn and leave
    // the destination unmarked until the scroll landed — the marker would
    // flicker off and back on for every click of a dot.
    await carousel.goTo(3);
    // One frame for the state to reach the dots, then the scroll is still
    // running: it takes about eight more to cover the 600px.
    await settle();

    const samples: boolean[][] = [];
    for (let index = 0; index < 30; index += 1) {
      samples.push(currentFlags(buttons));
      await settle();
    }

    expect(samples.every((flags) => flags[3])).toBe(true);
    expect(samples.every((flags) => flags.filter(Boolean).length === 1)).toBe(true);
  });

  it('reports again once a gesture takes the scroll back', async () => {
    const { el, carousel, buttons } = await render({ count: 5 });
    const wrapper = el.querySelector('[data-component="CarouselWrapper"]') as HTMLElement;

    await carousel.goTo(4);
    // A pointer on the track ends the programmatic scroll, so the index has to
    // follow the wrapper again rather than wait out the settle.
    wrapper.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    wrapper.scrollTo({ left: 0, behavior: 'instant' });

    await waitFor(() => currentFlags(buttons)[0], { timeout: 2000 });
    expect(currentFlags(buttons)).toEqual([true, false, false, false, false]);
  });

  it('never takes a dot out of the tab order', async () => {
    const { carousel, buttons } = await render({ count: 3 });

    await carousel.goTo(1);
    await waitFor(() => currentFlags(buttons)[1], { timeout: 2000 });

    // The whole reason the marker is `aria-current` and not `disabled`: a
    // `disabled` button leaves the accessibility tree, so the set of dots would
    // lose one every time the carousel moved.
    expect(buttons.map((button) => button.disabled)).toEqual([false, false, false]);
    expect(buttons.some((button) => button.hasAttribute('disabled'))).toBe(false);
  });

  it('carries no tab semantics, anywhere', async () => {
    const { dotsEl, buttons } = await render({ count: 3 });

    expect(dotsEl.hasAttribute('role')).toBe(false);
    for (const button of buttons) {
      expect(button.hasAttribute('role')).toBe(false);
      expect(button.hasAttribute('aria-selected')).toBe(false);
    }
  });
});

describe('CarouselDots — navigation', () => {
  it('goes to the slide a dot names', async () => {
    const { carousel, buttons } = await render({ count: 3 });

    buttons[2].click();

    await waitFor(() => carousel.currentIndex === 2);
    expect(carousel.currentIndex).toBe(2);
  });

  it('resolves a click landing inside the dot', async () => {
    const { carousel, buttons } = await render({
      count: 3,
      dotContent: { 1: '<span>two</span>' },
    });

    (buttons[1].firstElementChild as HTMLElement).click();

    await waitFor(() => carousel.currentIndex === 1);
    expect(carousel.currentIndex).toBe(1);
  });

  it('drives a dot added after mount', async () => {
    const { carousel, el, dotsEl } = await render({ count: 2 });

    const slide = document.createElement('div');
    slide.setAttribute('data-component', 'CarouselItem');
    slide.style.cssText = ITEM_STYLE;
    (el.querySelector('[data-component="CarouselWrapper"]') as HTMLElement).append(slide);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('data-ref', 'dots[]');
    dotsEl.append(dot);
    await settle();

    dot.click();

    await waitFor(() => dot.getAttribute('aria-current') === 'true', { timeout: 2000 });
    expect(carousel.currentIndex).toBe(2);
  });
});

describe('CarouselDots — mount order', () => {
  it('does nothing while there is no carousel above it', async () => {
    const dotsEl = document.createElement('div');
    dotsEl.setAttribute('data-component', 'CarouselDots');
    dotsEl.innerHTML = '<button type="button" data-ref="dots[]"></button>';
    document.body.append(dotsEl);
    await settle();

    const dots = await waitFor(() => getInstance<CarouselDots>(dotsEl, 'CarouselDots'));
    const button = dotsEl.querySelector('button') as HTMLButtonElement;

    // Not throwing is half the contract; staying unmarked is the other half.
    button.click();
    await quiet();

    expect(dots.carousel).toBeUndefined();
    expect(button.hasAttribute('aria-current')).toBe(false);
    expect(button.hasAttribute('aria-label')).toBe(false);
  });

  it('wires itself up when the carousel arrives after it', async () => {
    const dotsEl = document.createElement('div');
    dotsEl.setAttribute('data-component', 'CarouselDots');
    dotsEl.innerHTML = Array.from(
      { length: 3 },
      () => '<button type="button" data-ref="dots[]"></button>',
    ).join('');
    document.body.append(dotsEl);
    await settle();
    await waitFor(() => getInstance<CarouselDots>(dotsEl, 'CarouselDots'));

    const el = document.createElement('div');
    el.setAttribute('data-component', 'Carousel');
    el.setAttribute('aria-label', 'Featured products');
    el.innerHTML = `<div data-component="CarouselWrapper" style="${WRAPPER_STYLE}">${slides(3)}</div>`;
    document.body.append(el);
    el.append(dotsEl);
    await settle();

    const buttons = [...dotsEl.querySelectorAll<HTMLButtonElement>('button')];
    await waitFor(() => buttons[0].getAttribute('aria-current') === 'true');

    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      '1 of 3',
      '2 of 3',
      '3 of 3',
    ]);

    buttons[1].click();
    const carousel = getInstance<Carousel>(el, 'Carousel')!;
    await waitFor(() => carousel.currentIndex === 1);
    expect(carousel.currentIndex).toBe(1);
  });
});

describe('CarouselDots — teardown', () => {
  it('gives back the attributes it wrote', async () => {
    const { dotsEl, buttons } = await render({
      count: 3,
      dotAttributes: { 2: 'aria-label="Third"' },
    });
    expect(buttons[0].getAttribute('aria-current')).toBe('true');

    dotsEl.remove();
    await settle();

    expect(buttons[0].hasAttribute('aria-current')).toBe(false);
    expect(buttons[0].hasAttribute('aria-label')).toBe(false);
    // The author's own name is not the component's to take away.
    expect(buttons[2].getAttribute('aria-label')).toBe('Third');
  });
});
