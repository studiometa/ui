import { afterEach, describe, expect, it } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Carousel } from '#private/Carousel/Carousel.js';
import { CarouselItem } from '#private/Carousel/CarouselItem.js';
import { CarouselThumbnails } from '#private/Carousel/CarouselThumbnails.js';
import { CarouselWrapper } from '#private/Carousel/CarouselWrapper.js';

registerComponents(Carousel, CarouselItem, CarouselThumbnails, CarouselWrapper);

afterEach(resetDom);

const WRAPPER_STYLE =
  'display:flex;overflow:auto;width:200px;height:100px;scroll-snap-type:x mandatory';
const ITEM_STYLE = 'flex:0 0 200px;width:200px;height:100px';

/**
 * A 1×1 transparent GIF, so the thumbnails are real `<img>` elements with a
 * real `alt` rather than stand-ins — the naming rule this component exists for
 * reads the image, and a `<div>` would not exercise it.
 */
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

interface RenderOptions {
  count?: number;
  attributes?: string;
  /** The `alt` of the thumbnail image at that index. Omitted means `alt=""`. */
  alts?: Record<number, string>;
  /** Extra attributes on the thumbnail button at that index. */
  thumbAttributes?: Record<number, string>;
}

interface Rendered {
  el: HTMLElement;
  carousel: Carousel;
  thumbnails: CarouselThumbnails;
  thumbsEl: HTMLElement;
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
  alts = {},
  thumbAttributes = {},
}: RenderOptions = {}): Promise<Rendered> {
  const buttons = Array.from(
    { length: count },
    (_, index) =>
      `<button type="button" data-ref="thumbs[]" ${thumbAttributes[index] ?? ''}>
        <img src="${PIXEL}" width="20" height="20" alt="${alts[index] ?? ''}">
      </button>`,
  ).join('');

  const root = document.createElement('div');
  root.innerHTML = `
    <div data-component="Carousel" aria-label="Product images" ${attributes}>
      <div data-component="CarouselWrapper" style="${WRAPPER_STYLE}">${slides(count)}</div>
      <div data-component="CarouselThumbnails">${buttons}</div>
    </div>`;
  document.body.append(root);
  await settle();

  const el = root.firstElementChild as HTMLElement;
  const thumbsEl = el.querySelector('[data-component="CarouselThumbnails"]') as HTMLElement;

  return {
    el,
    thumbsEl,
    carousel: getInstance<Carousel>(el, 'Carousel')!,
    thumbnails: await waitFor(() =>
      getInstance<CarouselThumbnails>(thumbsEl, 'CarouselThumbnails'),
    ),
    buttons: [...thumbsEl.querySelectorAll<HTMLButtonElement>('button')],
  };
}

async function quiet(count = 10): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await settle();
  }
}

function currentFlags(buttons: HTMLButtonElement[]): boolean[] {
  return buttons.map((button) => button.getAttribute('aria-current') === 'true');
}

describe('CarouselThumbnails — naming', () => {
  it('leaves the image `alt` to name the button', async () => {
    const { buttons } = await render({
      count: 3,
      alts: { 0: 'Red dress, front', 1: 'Red dress, back', 2: 'Red dress, detail' },
    });

    // The `alt` already is the button's accessible name, and it says which
    // slide the button opens — which "2 of 3" never could.
    for (const button of buttons) {
      expect(button.hasAttribute('aria-label')).toBe(false);
    }
  });

  it('falls back to the slide name when the image is decorative', async () => {
    const { buttons } = await render({ count: 3, alts: { 1: 'Red dress, back' } });

    // `alt=""` on 0 and 2 leaves those buttons nameless; the fallback fills in.
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      '1 of 3',
      null,
      '3 of 3',
    ]);
  });

  it('translates the fallback through the carousel `slide-label` option', async () => {
    const { buttons } = await render({
      count: 3,
      attributes: 'data-option-slide-label="Vue {index} sur {total}"',
    });

    expect(buttons[1].getAttribute('aria-label')).toBe('Vue 2 sur 3');
  });

  it('never overwrites a name the author wrote on the button', async () => {
    const { buttons } = await render({
      count: 3,
      thumbAttributes: { 0: 'aria-label="Open the front view"' },
    });

    expect(buttons[0].getAttribute('aria-label')).toBe('Open the front view');
  });

  it('every thumbnail ends up naming something', async () => {
    const { buttons } = await render({ count: 4, alts: { 2: 'Detail' } });

    for (const button of buttons) {
      const image = button.querySelector('img') as HTMLImageElement;
      const name = button.getAttribute('aria-label') ?? image.alt.trim();
      expect(name).toBeTruthy();
    }
  });

  it('rewrites the fallback names when the slide count changes', async () => {
    const { el, thumbsEl, buttons } = await render({ count: 3 });
    expect(buttons[0].getAttribute('aria-label')).toBe('1 of 3');

    const slide = document.createElement('div');
    slide.setAttribute('data-component', 'CarouselItem');
    slide.style.cssText = ITEM_STYLE;
    (el.querySelector('[data-component="CarouselWrapper"]') as HTMLElement).append(slide);

    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.setAttribute('data-ref', 'thumbs[]');
    thumbsEl.append(thumb);
    await settle();

    await waitFor(() => buttons[0].getAttribute('aria-label') === '1 of 4');
    expect(thumb.getAttribute('aria-label')).toBe('4 of 4');
  });
});

describe('CarouselThumbnails — the current marker', () => {
  it('marks the open slide with `aria-current`', async () => {
    const { buttons } = await render({ count: 3 });

    expect(currentFlags(buttons)).toEqual([true, false, false]);
  });

  it('moves the marker when the carousel moves', async () => {
    const { carousel, buttons } = await render({ count: 3 });

    await carousel.goTo(2);
    await waitFor(() => currentFlags(buttons)[2], { timeout: 2000 });

    expect(currentFlags(buttons)).toEqual([false, false, true]);
  });

  it('never takes a thumbnail out of the tab order', async () => {
    const { carousel, buttons } = await render({ count: 3 });

    await carousel.goTo(1);
    await waitFor(() => currentFlags(buttons)[1], { timeout: 2000 });

    expect(buttons.map((button) => button.disabled)).toEqual([false, false, false]);
  });

  it('carries no tab semantics, anywhere', async () => {
    const { thumbsEl, buttons } = await render({ count: 3 });

    expect(thumbsEl.hasAttribute('role')).toBe(false);
    for (const button of buttons) {
      expect(button.hasAttribute('role')).toBe(false);
      expect(button.hasAttribute('aria-selected')).toBe(false);
    }
  });
});

describe('CarouselThumbnails — navigation', () => {
  it('opens the slide a thumbnail shows', async () => {
    const { carousel, buttons } = await render({ count: 3 });

    buttons[2].click();

    await waitFor(() => carousel.currentIndex === 2, { timeout: 2000 });
    expect(carousel.currentIndex).toBe(2);
  });

  it('resolves a click landing on the image', async () => {
    const { carousel, buttons } = await render({ count: 3 });

    (buttons[1].querySelector('img') as HTMLElement).click();

    await waitFor(() => carousel.currentIndex === 1, { timeout: 2000 });
    expect(carousel.currentIndex).toBe(1);
  });
});

describe('CarouselThumbnails — mount order', () => {
  it('does nothing while there is no carousel above it', async () => {
    const thumbsEl = document.createElement('div');
    thumbsEl.setAttribute('data-component', 'CarouselThumbnails');
    thumbsEl.innerHTML = `<button type="button" data-ref="thumbs[]"><img src="${PIXEL}" alt=""></button>`;
    document.body.append(thumbsEl);
    await settle();

    const thumbnails = await waitFor(() =>
      getInstance<CarouselThumbnails>(thumbsEl, 'CarouselThumbnails'),
    );
    const button = thumbsEl.querySelector('button') as HTMLButtonElement;

    button.click();
    await quiet();

    expect(thumbnails.carousel).toBeUndefined();
    expect(button.hasAttribute('aria-current')).toBe(false);
    expect(button.hasAttribute('aria-label')).toBe(false);
  });

  it('wires itself up when the carousel arrives after it', async () => {
    const thumbsEl = document.createElement('div');
    thumbsEl.setAttribute('data-component', 'CarouselThumbnails');
    thumbsEl.innerHTML = Array.from(
      { length: 3 },
      () => `<button type="button" data-ref="thumbs[]"><img src="${PIXEL}" alt=""></button>`,
    ).join('');
    document.body.append(thumbsEl);
    await settle();
    await waitFor(() => getInstance<CarouselThumbnails>(thumbsEl, 'CarouselThumbnails'));

    const el = document.createElement('div');
    el.setAttribute('data-component', 'Carousel');
    el.setAttribute('aria-label', 'Product images');
    el.innerHTML = `<div data-component="CarouselWrapper" style="${WRAPPER_STYLE}">${slides(3)}</div>`;
    document.body.append(el);
    el.append(thumbsEl);
    await settle();

    const buttons = [...thumbsEl.querySelectorAll<HTMLButtonElement>('button')];
    await waitFor(() => buttons[0].getAttribute('aria-current') === 'true');

    expect(buttons[1].getAttribute('aria-label')).toBe('2 of 3');

    buttons[1].click();
    const carousel = getInstance<Carousel>(el, 'Carousel')!;
    await waitFor(() => carousel.currentIndex === 1, { timeout: 2000 });
    expect(carousel.currentIndex).toBe(1);
  });
});

describe('CarouselThumbnails — teardown', () => {
  it('gives back the attributes it wrote', async () => {
    const { thumbsEl, buttons } = await render({ count: 3, alts: { 2: 'Detail' } });
    expect(buttons[0].getAttribute('aria-current')).toBe('true');
    expect(buttons[0].getAttribute('aria-label')).toBe('1 of 3');

    thumbsEl.remove();
    await settle();

    expect(buttons[0].hasAttribute('aria-current')).toBe(false);
    expect(buttons[0].hasAttribute('aria-label')).toBe(false);
  });
});
