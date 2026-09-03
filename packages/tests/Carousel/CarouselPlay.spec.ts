import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import {
  captureDiagnostics,
  recordEvents,
  resetDom,
  settle,
  waitFor,
} from '@studiometa/js-toolkit/test';
import { Carousel } from '#private/Carousel/Carousel.js';
import { CarouselItem } from '#private/Carousel/CarouselItem.js';
import { CarouselPlay } from '#private/Carousel/CarouselPlay.js';
import { CarouselWrapper } from '#private/Carousel/CarouselWrapper.js';

/**
 * A controllable `(prefers-reduced-motion: reduce)`.
 *
 * The component reads the query through the toolkit's shared media service,
 * which owns a real `MediaQueryList` and listens to its `change` event. Nothing
 * in the DOM can flip an OS setting, so the query itself is replaced — only
 * that one, so the `media:` mount strategies in the same page keep their real
 * answers. The service is memoised per query string, so the object handed out
 * here has to keep answering: `matches` is a live getter rather than a value.
 */
let prefersReducedMotion = false;
const reducedMotionListeners = new Set<() => void>();

function setReducedMotion(value: boolean): void {
  prefersReducedMotion = value;
  for (const listener of reducedMotionListeners) {
    listener();
  }
}

beforeAll(() => {
  const realMatchMedia = window.matchMedia.bind(window);

  window.matchMedia = ((query: string) => {
    if (!query.includes('prefers-reduced-motion')) {
      return realMatchMedia(query);
    }

    return {
      media: query,
      get matches() {
        return prefersReducedMotion;
      },
      addEventListener: (_type: string, listener: () => void) =>
        reducedMotionListeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) =>
        reducedMotionListeners.delete(listener),
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
});

registerComponents(Carousel, CarouselItem, CarouselPlay, CarouselWrapper);

afterEach(async () => {
  setReducedMotion(false);
  await resetDom();
});

const WRAPPER_STYLE =
  'display:flex;overflow:auto;width:200px;height:100px;scroll-snap-type:x mandatory';
const ITEM_STYLE = 'flex:0 0 200px;width:200px;height:100px';

interface Rendered {
  el: HTMLElement;
  carousel: Carousel;
  play: CarouselPlay;
  button: HTMLButtonElement;
}

async function render({
  count = 3,
  attributes = 'data-option-delay="0.02"',
  content = '',
  before = '',
} = {}): Promise<Rendered> {
  const root = document.createElement('div');
  // Away from the origin, deliberately. The browser's pointer starts at
  // `(0, 0)` and Chromium re-evaluates the hover target when the layout
  // changes, so a fixture rendered at the top left receives a real
  // `pointerenter` the moment it appears — and the component, correctly,
  // pauses for it.
  root.style.cssText = 'position:absolute;top:300px;left:300px';
  root.innerHTML = `
    <div data-component="Carousel">
      ${before}
      <button type="button" data-component="CarouselPlay" ${attributes}>${content}</button>
      <div data-component="CarouselWrapper" style="${WRAPPER_STYLE}">
        ${Array.from(
          { length: count },
          () => `<div data-component="CarouselItem" style="${ITEM_STYLE}"></div>`,
        ).join('')}
      </div>
    </div>`;
  document.body.append(root);
  await settle();

  const el = root.firstElementChild as HTMLElement;
  const button = el.querySelector('button') as HTMLButtonElement;

  return {
    el,
    button,
    carousel: getInstance<Carousel>(el, 'Carousel')!,
    play: await waitFor(() => getInstance<CarouselPlay>(button, 'CarouselPlay')),
  };
}

/** A bounded quiet period, for the states asserted as unchanged. */
async function quiet(count = 20): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await settle();
  }
}

function hover(el: HTMLElement): void {
  el.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
}

describe('CarouselPlay — the rotation', () => {
  it('advances the carousel when the countdown ends', async () => {
    const { carousel } = await render({ count: 3 });

    await waitFor(() => carousel.currentIndex === 1, { timeout: 2000 });

    expect(carousel.currentIndex).toBe(1);
  });

  it('wraps back to the first slide at the end of the track', async () => {
    const { carousel } = await render({ count: 2 });

    await waitFor(() => carousel.currentIndex === 1, { timeout: 2000 });
    // `clamp` is the default boundary, so `goNext()` alone would stop here.
    await waitFor(() => carousel.currentIndex === 0, { timeout: 2000 });

    expect(carousel.currentIndex).toBe(0);
  });

  it('composes the `Timer` lifecycle instead of restating it', async () => {
    const { el } = await render({ count: 3 });
    const log = recordEvents(el, 'timer-start', 'timer-end', 'timer-progress');
    await waitFor(() => log.events.some(({ type }) => type === 'timer-end'), { timeout: 2000 });
    log.stop();

    const types = new Set(log.events.map(({ type }) => type));
    expect(types.has('timer-end')).toBe(true);
    // The progress ring `TimerProgress` already builds, unchanged.
    expect(types.has('timer-progress')).toBe(true);
  });

  it('does not start on its own with `data-option-no-autostart`', async () => {
    const { carousel, play } = await render({
      count: 3,
      attributes: 'data-option-delay="0.02" data-option-no-autostart',
    });
    await quiet();

    expect(play.isPlaying).toBe(false);
    expect(carousel.currentIndex).toBe(0);
  });

  it('reads `data-option-autostart="false"` as true, which is the trap', async () => {
    const { play } = await render({
      count: 3,
      attributes: 'data-option-delay="5" data-option-autostart="false"',
    });

    expect(play.$options.autostart).toBe(true);
    expect(play.isPlaying).toBe(true);
  });
});

describe('CarouselPlay — the control', () => {
  it('names itself after what pressing it will do', async () => {
    const { button, play } = await render({ count: 3, attributes: 'data-option-delay="5"' });
    expect(button.getAttribute('aria-label')).toBe('Stop automatic slide show');

    play.stop();

    expect(button.getAttribute('aria-label')).toBe('Start automatic slide show');
  });

  it('writes the visible label instead when there is a `label` ref', async () => {
    const { button, play } = await render({
      count: 3,
      attributes: 'data-option-delay="5"',
      content: '<span data-ref="label"></span>',
    });
    const label = button.querySelector('[data-ref="label"]') as HTMLElement;
    expect(label.textContent).toBe('Stop automatic slide show');
    expect(button.hasAttribute('aria-label')).toBe(false);

    play.stop();

    expect(label.textContent).toBe('Start automatic slide show');
  });

  it('takes its names from the options', async () => {
    const { button } = await render({
      count: 3,
      attributes: 'data-option-delay="5" data-option-label-stop="Pause"',
    });

    expect(button.getAttribute('aria-label')).toBe('Pause');
  });

  it('carries no `aria-pressed`', async () => {
    const { button, play } = await render({ count: 3, attributes: 'data-option-delay="5"' });
    expect(button.hasAttribute('aria-pressed')).toBe(false);

    play.stop();

    expect(button.hasAttribute('aria-pressed')).toBe(false);
  });

  it('toggles the rotation on a click', async () => {
    const { button, play } = await render({ count: 3, attributes: 'data-option-delay="5"' });
    expect(play.isPlaying).toBe(true);

    button.click();
    expect(play.isPlaying).toBe(false);

    button.click();
    expect(play.isPlaying).toBe(true);
  });

  it('does not move the focus when activated', async () => {
    const { button } = await render({ count: 3, attributes: 'data-option-delay="5"' });

    button.focus();
    button.click();
    await quiet();

    expect(document.activeElement).toBe(button);
  });

  it('warns when it is not the first focusable element in the carousel', async () => {
    const log = captureDiagnostics();

    await render({
      count: 3,
      attributes: 'data-option-delay="5"',
      before: '<a href="#somewhere">Skip</a>',
    });
    log.stop();

    expect(log.codes).toContain('carousel-play.not-first-focusable');
  });

  it('stays quiet when it is the first focusable element', async () => {
    const log = captureDiagnostics();

    await render({ count: 3, attributes: 'data-option-delay="5"' });
    log.stop();

    expect(log.codes).not.toContain('carousel-play.not-first-focusable');
  });
});

describe('CarouselPlay — stopping for the user', () => {
  it('pauses on hover over the carousel, not only over the button', async () => {
    const { el, play } = await render({ count: 3, attributes: 'data-option-delay="5"' });
    expect(play.isPlaying).toBe(true);

    hover(el);

    expect(play.isPlaying).toBe(false);
    expect(play.paused).toBe(true);
  });

  it('pauses on focus entering the carousel', async () => {
    const { el, play } = await render({
      count: 3,
      attributes: 'data-option-delay="5"',
      before: '<a href="#somewhere">Link</a>',
    });
    expect(play.isPlaying).toBe(true);

    (el.querySelector('a') as HTMLElement).focus();

    expect(play.isPlaying).toBe(false);
  });

  it('does not resume by itself once the pointer or the focus leaves', async () => {
    const { el, play } = await render({ count: 3, attributes: 'data-option-delay="5"' });

    hover(el);
    el.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await quiet();

    expect(play.isPlaying).toBe(false);
  });

  it('renames itself while paused', async () => {
    const { el, button } = await render({ count: 3, attributes: 'data-option-delay="5"' });

    hover(el);

    expect(button.getAttribute('aria-label')).toBe('Start automatic slide show');
  });
});

describe('CarouselPlay — reduced motion', () => {
  it('does not start when the user asks for less motion', async () => {
    setReducedMotion(true);
    const { carousel, play } = await render({ count: 3 });
    await quiet();

    expect(play.isPlaying).toBe(false);
    expect(carousel.currentIndex).toBe(0);
  });

  it('stops a rotation when the setting is turned on at runtime', async () => {
    const { play } = await render({ count: 3, attributes: 'data-option-delay="5"' });
    expect(play.isPlaying).toBe(true);

    // The whole point of the subscription: a component that sampled the query
    // once at mount would still be rotating here.
    setReducedMotion(true);
    await quiet();

    expect(play.isPlaying).toBe(false);
  });

  it('still answers an explicit press', async () => {
    setReducedMotion(true);
    const { button, play } = await render({ count: 3, attributes: 'data-option-delay="5"' });
    expect(play.isPlaying).toBe(false);

    button.click();

    expect(play.isPlaying).toBe(true);
  });
});

describe('CarouselPlay — teardown', () => {
  it('cancels its countdown once it leaves the DOM', async () => {
    const { carousel, button, play } = await render({
      count: 3,
      attributes: 'data-option-delay="0.02"',
    });
    await waitFor(() => carousel.currentIndex === 1, { timeout: 2000 });

    button.remove();
    // Asserted directly rather than polled for: the countdown is `null`
    // between two repeats as well, so waiting for it to be gone would pass
    // for the wrong reason.
    await settle();
    await settle();
    const index = carousel.currentIndex;
    await quiet();

    expect(play.isPlaying).toBe(false);
    expect(carousel.currentIndex).toBe(index);
  });

  it('does nothing at all outside a carousel', async () => {
    const root = document.createElement('div');
    root.innerHTML = `<button type="button" data-component="CarouselPlay" data-option-delay="0.02"></button>`;
    document.body.append(root);
    await settle();

    const play = await waitFor(() =>
      getInstance<CarouselPlay>(root.firstElementChild as HTMLElement, 'CarouselPlay'),
    );
    await quiet();

    expect(play.carousel).toBeUndefined();
    expect(play.isPlaying).toBe(true);
  });
});
