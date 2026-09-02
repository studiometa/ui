import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from '@vitest/browser/context';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Carousel } from '#private/Carousel/Carousel.js';
import { CarouselBtn } from '#private/Carousel/CarouselBtn.js';
import { CarouselItem } from '#private/Carousel/CarouselItem.js';
import { CarouselWrapper } from '#private/Carousel/CarouselWrapper.js';

registerComponents(Carousel, CarouselBtn, CarouselItem, CarouselWrapper);

afterEach(async () => {
  await emulateReducedMotion(false);
  resetDom();
});

const WRAPPER_STYLE =
  'display:flex;overflow:auto;width:200px;height:100px;scroll-snap-type:x mandatory';

interface RenderOptions {
  /** How many slides. */
  count?: number;
  /** The width of one slide, in pixels. A quarter of the track shows four. */
  itemWidth?: number;
  /** Extra attributes on the root element. */
  attributes?: string;
  /** Extra attributes on the track. */
  wrapperAttributes?: string;
  /** Extra declarations appended to the track's own style. */
  wrapperStyle?: string;
  /** Extra attributes on the slide at that index. */
  itemAttributes?: Record<number, string>;
  /** Put a link inside the slide at each of these indexes. */
  linksIn?: number[];
  /** Markup appended after the track, for buttons. */
  controls?: string;
  /** Drop the `aria-label` naming the carousel. */
  unnamed?: boolean;
}

interface Rendered {
  el: HTMLElement;
  carousel: Carousel;
  wrapper: HTMLElement;
  items: HTMLElement[];
}

async function render({
  count = 3,
  itemWidth = 200,
  attributes = '',
  wrapperAttributes = '',
  wrapperStyle = '',
  itemAttributes = {},
  linksIn = [],
  controls = '',
  unnamed = false,
}: RenderOptions = {}): Promise<Rendered> {
  const slides = Array.from({ length: count }, (_, index) => {
    const link = linksIn.includes(index)
      ? `<a href="#" id="link-${index}">Link ${index}</a>`
      : `Slide ${index}`;
    return `<div data-component="CarouselItem" style="flex:0 0 ${itemWidth}px;width:${itemWidth}px;height:100px" ${
      itemAttributes[index] ?? ''
    }>${link}</div>`;
  }).join('');

  const root = document.createElement('div');
  root.innerHTML = `
    <button type="button" id="before">before</button>
    <div data-component="Carousel" ${unnamed ? '' : 'aria-label="Featured products"'} ${attributes}>
      <div data-component="CarouselWrapper" style="${WRAPPER_STYLE};${wrapperStyle}" ${wrapperAttributes}>${slides}</div>
      ${controls}
    </div>
    <button type="button" id="after">after</button>`;
  document.body.append(root);
  await settle();

  const el = root.querySelector('[data-component="Carousel"]') as HTMLElement;

  return {
    el,
    carousel: getInstance<Carousel>(el, 'Carousel')!,
    wrapper: el.querySelector('[data-component~="CarouselWrapper"]') as HTMLElement,
    items: [...el.querySelectorAll<HTMLElement>('[data-component="CarouselItem"]')],
  };
}

/** The `inert` flag of every slide, in DOM order. */
function inertFlags(items: HTMLElement[]): boolean[] {
  return items.map((item) => item.inert);
}

/**
 * Flip the real `prefers-reduced-motion` setting through the DevTools
 * protocol, so the media query the component listens to actually changes —
 * rather than a stub standing in for it.
 */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  // Both states are pinned. An empty `features` array clears the override and
  // falls back to whatever the host prefers, which is not the same thing as
  // `no-preference`: CI runners with reduce-motion enabled then failed the
  // "back to smooth" assertion while a laptop passed it.
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

/** A bounded quiet period, for the states asserted to be *unchanged*. */
async function quiet(count = 10): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await settle();
  }
}

describe('Carousel a11y — the container', () => {
  it('gives the carousel an explicit role, so `aria-roledescription` can be honoured', async () => {
    const { el } = await render();
    expect(el.getAttribute('role')).toBe('group');
  });

  it('never overwrites a role the author chose', async () => {
    const { el } = await render({ attributes: 'role="region"' });
    expect(el.getAttribute('role')).toBe('region');
  });

  it('does not emit an untranslated `aria-roledescription`', async () => {
    const { el, items } = await render();
    await quiet();

    expect(el.hasAttribute('aria-roledescription')).toBe(false);
    expect(items.some((item) => item.hasAttribute('aria-roledescription'))).toBe(false);
  });

  it("keeps the author's own `aria-roledescription`", async () => {
    const { el } = await render({ attributes: 'aria-roledescription="carrousel"' });
    await quiet();

    expect(el.getAttribute('aria-roledescription')).toBe('carrousel');
    // The role has to be there too, or Chrome drops the roledescription.
    expect(el.hasAttribute('role')).toBe(true);
  });

  it('reports a carousel with no accessible name', async () => {
    const diagnostics = captureDiagnostics();
    await render({ unnamed: true });

    expect(diagnostics.codes).toContain('carousel.unnamed');
    diagnostics.stop();
  });

  it('says nothing about a named carousel', async () => {
    const diagnostics = captureDiagnostics();
    await render();

    expect(diagnostics.codes).not.toContain('carousel.unnamed');
    diagnostics.stop();
  });

  /**
   * Chrome's own carousel guidance calls a live region on a scroll track
   * confusing and noisy outside a single-item carousel: every scroll of a
   * multi-slide track announces content the user did not ask for.
   */
  it('adds no `aria-live` anywhere', async () => {
    const { el } = await render();
    await quiet();

    expect(el.querySelectorAll('[aria-live]')).toHaveLength(0);
    expect(el.hasAttribute('aria-live')).toBe(false);
  });
});

describe('Carousel a11y — slide names', () => {
  it('names a slide by its position out of a live total, not by its id', async () => {
    const { items, carousel } = await render({ count: 3 });
    await waitFor(() => items[0].hasAttribute('aria-label'));

    expect(items.map((item) => item.getAttribute('aria-label'))).toEqual([
      '1 of 3',
      '2 of 3',
      '3 of 3',
    ]);
    // The name is the slide's position, never the internal identifier v1's
    // `SliderItem` used — "SliderItem-12" was an accessible name.
    expect(items[0].getAttribute('aria-label')).not.toBe(carousel.items.items[0].$id);
  });

  it('gives every slide the group role', async () => {
    const { items } = await render({ count: 3 });
    expect(items.map((item) => item.getAttribute('role'))).toEqual(['group', 'group', 'group']);
  });

  it('re-counts the total when a slide is appended', async () => {
    const { items, wrapper } = await render({ count: 2 });
    await waitFor(() => items[0].getAttribute('aria-label') === '1 of 2');

    wrapper.insertAdjacentHTML(
      'beforeend',
      '<div data-component="CarouselItem" style="flex:0 0 200px;width:200px;height:100px"></div>',
    );
    await waitFor(() => items[0].getAttribute('aria-label') === '1 of 3');

    expect(items[0].getAttribute('aria-label')).toBe('1 of 3');
  });

  it('is localisable through the `slide-label` option', async () => {
    const { items } = await render({
      count: 2,
      attributes: 'data-option-slide-label="Diapositive {index} sur {total}"',
    });
    await waitFor(() => items[0].hasAttribute('aria-label'));

    expect(items.map((item) => item.getAttribute('aria-label'))).toEqual([
      'Diapositive 1 sur 2',
      'Diapositive 2 sur 2',
    ]);
  });

  it('leaves a caption the author wrote alone', async () => {
    const { items } = await render({
      count: 2,
      itemAttributes: { 0: 'aria-label="A red bicycle"' },
    });
    await waitFor(() => items[1].hasAttribute('aria-label'));

    expect(items[0].getAttribute('aria-label')).toBe('A red bicycle');
    expect(items[1].getAttribute('aria-label')).toBe('2 of 2');
  });
});

describe('Carousel a11y — what is presented', () => {
  it('makes every slide that does not intersect the track inert', async () => {
    const { items } = await render({ count: 3 });
    await waitFor(() => items[1].inert);

    expect(inertFlags(items)).toEqual([false, true, true]);
  });

  /**
   * The distinguishing case. Four 100px slides in a 200px track show **two**
   * at once. "Everything but the snapped one" would hide slide 1, which the
   * user is looking at — the defect Embla's v9 accessibility plugin shipped.
   * "Everything not intersecting" keeps both.
   */
  it('keeps every visible slide reachable under a multi-slide layout', async () => {
    const { items } = await render({ count: 4, itemWidth: 100 });
    await waitFor(() => items[2].inert);

    expect(inertFlags(items)).toEqual([false, false, true, true]);
  });

  it('follows the scroll', async () => {
    const { items, wrapper } = await render({ count: 3 });
    await waitFor(() => items[1].inert);

    wrapper.scrollTo({ left: 400, behavior: 'instant' });
    await waitFor(() => !items[2].inert);

    expect(inertFlags(items)).toEqual([true, true, false]);
  });

  it('does not use `aria-hidden`, which leaves a slide fully tabbable', async () => {
    const { items } = await render({ count: 3 });
    await waitFor(() => items[1].inert);

    expect(items.some((item) => item.hasAttribute('aria-hidden'))).toBe(false);
  });

  it('releases every slide when the carousel unmounts', async () => {
    const { carousel, items } = await render({ count: 3 });
    await waitFor(() => items[1].inert);

    carousel.$unmount();
    await quiet();

    expect(inertFlags(items)).toEqual([false, false, false]);
  });

  /**
   * The one that matters, driven with real key presses rather than a
   * tab-order model: a link in a slide that scrolled away must not be a tab
   * stop.
   */
  it('takes a link in an off-screen slide out of the tab sequence', async () => {
    const { items } = await render({ count: 3, linksIn: [0, 2] });
    await waitFor(() => items[2].inert);

    const before = document.querySelector('#before') as HTMLButtonElement;
    const after = document.querySelector('#after') as HTMLButtonElement;
    before.focus();
    expect(document.activeElement).toBe(before);

    await userEvent.tab();
    expect(document.activeElement).toBe(document.querySelector('#link-0'));

    await userEvent.tab();
    // Straight past the third slide's link, which is off-screen and inert.
    expect(document.activeElement).toBe(after);
  });

  it('lets the same link back in once its slide is scrolled into view', async () => {
    const { items, wrapper } = await render({ count: 3, linksIn: [0, 2] });
    await waitFor(() => items[2].inert);

    wrapper.scrollTo({ left: 400, behavior: 'instant' });
    await waitFor(() => !items[2].inert);

    const before = document.querySelector('#before') as HTMLButtonElement;
    before.focus();
    await userEvent.tab();

    expect(document.activeElement).toBe(document.querySelector('#link-2'));
  });
});

describe('Carousel a11y — the keyboard', () => {
  /**
   * The APG's contract for a non-tabbed carousel is Tab plus the buttons, and
   * a slide can hold a text input, a `<select>` or a nested widget that owns
   * the arrow keys. Nothing here binds them — not on the track, not on the
   * document — so the event reaches whatever the user is actually in.
   */
  it.each(['ArrowRight', 'ArrowLeft', 'Home', 'End', 'PageDown', 'PageUp'])(
    'leaves %s to the page',
    async (key) => {
      const { el, wrapper, carousel } = await render({ count: 3 });
      await waitFor(() => wrapper.hasAttribute('tabindex'));
      wrapper.focus();

      for (const target of [wrapper, el, document.body]) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
      }

      await quiet();
      expect(carousel.currentIndex).toBe(0);
    },
  );
});

describe('Carousel a11y — the track', () => {
  it('is a tab stop when nothing inside it is focusable', async () => {
    const { wrapper } = await render({ count: 3 });
    await waitFor(() => wrapper.hasAttribute('tabindex'));

    expect(wrapper.getAttribute('tabindex')).toBe('0');
    expect(wrapper.getAttribute('role')).toBe('group');
    expect(wrapper.getAttribute('aria-label')).toBe('Featured products');
  });

  it('is not a tab stop when a slide holds a link', async () => {
    const { wrapper } = await render({ count: 3, linksIn: [1] });
    await quiet();

    expect(wrapper.hasAttribute('tabindex')).toBe(false);
  });

  /**
   * The answer to "can this be decided from the markup": no. A slide's content
   * arrives after mount — a `Defer`, a `Fetch`, an appended slide — so the
   * probe has to be re-run, and it has to be able to take the tab stop back.
   */
  it('gives up the tab stop when a focusable slide is added', async () => {
    const { wrapper } = await render({ count: 2 });
    await waitFor(() => wrapper.hasAttribute('tabindex'));
    expect(wrapper.getAttribute('tabindex')).toBe('0');

    wrapper.insertAdjacentHTML(
      'beforeend',
      '<div data-component="CarouselItem" style="flex:0 0 200px;width:200px;height:100px"><a href="#">Link</a></div>',
    );
    await waitFor(() => !wrapper.hasAttribute('tabindex'));

    expect(wrapper.hasAttribute('tabindex')).toBe(false);
    expect(wrapper.hasAttribute('role')).toBe(false);
    expect(wrapper.hasAttribute('aria-label')).toBe(false);
  });

  /** `tabindex="-1"` on a scrollable region fails the ACT rule outright. */
  it('never writes a negative tabindex', async () => {
    const { wrapper } = await render({ count: 3, linksIn: [0] });
    await quiet();

    expect(wrapper.getAttribute('tabindex')).not.toBe('-1');
  });

  it('leaves a role and a name the author wrote alone', async () => {
    const { wrapper } = await render({
      count: 3,
      wrapperAttributes: 'role="region" aria-label="Slides"',
    });
    await waitFor(() => wrapper.hasAttribute('tabindex'));

    expect(wrapper.getAttribute('role')).toBe('region');
    expect(wrapper.getAttribute('aria-label')).toBe('Slides');
  });

  it('mirrors its own padding into `scroll-padding`, so a focused item is never clipped', async () => {
    const { wrapper } = await render({
      count: 3,
      wrapperStyle: 'padding-left:40px',
    });
    await waitFor(() => wrapper.style.getPropertyValue('scroll-padding-left') !== '');

    expect(wrapper.style.getPropertyValue('scroll-padding-left')).toBe('40px');
  });

  it('leaves a `scroll-padding` the author declared alone', async () => {
    const { wrapper } = await render({
      count: 3,
      wrapperStyle: 'padding-left:40px;scroll-padding-left:8px',
    });
    await quiet();

    expect(window.getComputedStyle(wrapper).scrollPaddingLeft).toBe('8px');
  });

  it('writes no `scroll-padding` when the track has none', async () => {
    const { wrapper } = await render({ count: 3 });
    await quiet();

    expect(wrapper.style.getPropertyValue('scroll-padding-left')).toBe('');
  });
});

describe('Carousel a11y — reduced motion', () => {
  it('drops the smooth scroll, and follows a change of the setting', async () => {
    const { carousel } = await render({ count: 3 });
    const wrapper = await waitFor(() => carousel.wrapper);
    expect(wrapper.scrollBehavior).toBe('smooth');

    // A single sample at init would leave this at `smooth` forever.
    await emulateReducedMotion(true);
    await waitFor(() => wrapper.scrollBehavior === 'instant');
    expect(wrapper.scrollBehavior).toBe('instant');

    await emulateReducedMotion(false);
    await waitFor(() => wrapper.scrollBehavior === 'smooth');
    expect(wrapper.scrollBehavior).toBe('smooth');
  });

  it('still arrives at the slide it was sent to', async () => {
    await emulateReducedMotion(true);
    const { carousel, wrapper } = await render({ count: 3 });
    await waitFor(() => carousel.wrapper?.scrollBehavior === 'instant');

    await carousel.goTo(2);
    await waitFor(() => wrapper.scrollLeft === 400, { timeout: 2000 });

    expect(wrapper.scrollLeft).toBe(400);
  });
});

describe('Carousel a11y — the controls', () => {
  const PICKER = `
    <button type="button" data-component="CarouselBtn" data-option-action="0">One</button>
    <button type="button" data-component="CarouselBtn" data-option-action="1">Two</button>`;

  /**
   * The APG prescribes `tablist`/`tab` here and every piece of user testing
   * that exists contradicts it; the objection has been open and unanswered for
   * eight years. Slide pickers stay plain buttons.
   */
  it('puts no tab semantics on the slide pickers', async () => {
    const { el } = await render({ count: 2, controls: PICKER });
    await quiet();

    expect(el.querySelectorAll('[role="tab"]')).toHaveLength(0);
    expect(el.querySelectorAll('[role="tablist"]')).toHaveLength(0);
    expect(el.querySelectorAll('[aria-selected]')).toHaveLength(0);
  });

  /**
   * A numeric button names a slide, not an action, which makes it a picker —
   * the same job as a dot or a thumbnail, so it carries the same marker. One
   * marker across the four means one CSS hook, and the picker for the slide
   * already showing is the one a screen reader user looks for, so it is never
   * removed from the tree or announced as unavailable.
   */
  it('marks the current slide picker `aria-current`, keeping it focusable', async () => {
    const { el } = await render({ count: 2, controls: PICKER });
    const [first, second] = [
      ...el.querySelectorAll<HTMLButtonElement>('[data-component="CarouselBtn"]'),
    ];
    await waitFor(() => first.getAttribute('aria-current') === 'true');

    expect(first.getAttribute('aria-current')).toBe('true');
    expect(second.hasAttribute('aria-current')).toBe(false);
    expect(first.disabled).toBe(false);
    expect(first.hasAttribute('aria-disabled')).toBe(false);

    first.focus();
    expect(document.activeElement).toBe(first);
  });

  it('marks the picker the same way a dot and a thumbnail are marked', async () => {
    const { el } = await render({ count: 2, controls: PICKER });
    await waitFor(() => el.querySelector('[aria-current="true"]'));

    // The contract authors style against: one selector, whichever control it
    // is. A picker that used its own attribute would need its own rule.
    expect(el.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
  });

  it('moves nothing when the picker for the current slide is clicked', async () => {
    const { el, carousel } = await render({ count: 2, controls: PICKER });
    const first = el.querySelector<HTMLButtonElement>('[data-option-action="0"]')!;
    await waitFor(() => first.getAttribute('aria-current') === 'true');

    first.click();
    await quiet();

    expect(carousel.currentIndex).toBe(0);
  });

  it('reports a control with no accessible name', async () => {
    const diagnostics = captureDiagnostics();
    await render({
      count: 2,
      controls:
        '<button type="button" data-component="CarouselBtn" data-option-action="next"></button>',
    });

    expect(diagnostics.codes).toContain('carousel.unnamed-btn');
    diagnostics.stop();
  });

  it('says nothing about a control the author named', async () => {
    const diagnostics = captureDiagnostics();
    await render({
      count: 2,
      controls:
        '<button type="button" data-component="CarouselBtn" data-option-action="next" aria-label="Next slide"></button>',
    });

    expect(diagnostics.codes).not.toContain('carousel.unnamed-btn');
    diagnostics.stop();
  });
});
