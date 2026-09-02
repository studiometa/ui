import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { frames, resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Marquee } from '#private/Marquee/Marquee.js';

/**
 * A controllable `(prefers-reduced-motion: reduce)`.
 *
 * The component reads the query through the toolkit's shared media service,
 * which owns a real `MediaQueryList`. Nothing in the DOM can flip an OS
 * setting, so the query itself is replaced — only that one, so the `media:`
 * mount strategies in the same page keep their real answers. The service is
 * memoised per query string, so the object handed out here has to keep
 * answering: `matches` is a live getter rather than a value.
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

registerComponents(Marquee);

afterEach(async () => {
  setReducedMotion(false);
  await resetDom();
});

/**
 * Render a marquee. It reads no geometry, so the element needs none — which is
 * the point of the redesign, and why this markup carries no width, no ref and
 * no overflow.
 */
async function render(attributes = ''): Promise<Marquee> {
  const root = document.createElement('div');
  root.innerHTML = `
    <div data-component="Marquee" ${attributes}>
      <span style="transform: translateX(calc(var(--marquee-progress, 0) * -100%))">Scrolling text</span>
    </div>
  `;
  document.body.append(root);
  await settle();

  const element = root.firstElementChild as HTMLElement;
  return getInstance<Marquee>(element, 'Marquee')!;
}

/** The number behind a published custom property. */
function published(marquee: Marquee, name: string): number {
  const value = marquee.$el.style.getPropertyValue(`--marquee-${name}`);
  return value === '' ? Number.NaN : Number(value);
}

describe('Marquee', () => {
  it('mounts through the in-view strategy', async () => {
    const marquee = await render();

    expect(marquee).toBeDefined();
    expect(marquee.$isMounted).toBe(true);
    // v3 passed `{ rootMargin: '50%' }` to `withMountWhenInView`; v4 carries the
    // same margin on the strategy name.
    expect(Marquee.config.mountStrategy).toBe('in-view:50%');
  });

  it('publishes its three properties while the page is still', async () => {
    const marquee = await render();

    await waitFor(() => published(marquee, 'progress') > 0);

    expect(published(marquee, 'progress')).toBeGreaterThan(0);
    expect(published(marquee, 'offset')).toBeGreaterThan(0);
    // The idle rate settles on `speed`, which is the default 0.1 loop/s.
    expect(published(marquee, 'velocity')).toBeGreaterThan(0);
  });

  it('advances the published progress frame after frame', async () => {
    const marquee = await render('data-option-speed="2"');

    const first = await waitFor(() => published(marquee, 'progress') || false);
    await frames(4);
    const second = published(marquee, 'progress');

    expect(second).toBeGreaterThan(first);
  });

  /**
   * The v1 `CircularMarquee` shipped with `scrolled()` and `ticked()` that were
   * never called, and no test caught it because there was no test. Reading the
   * element's own published values rather than the instance fields is what
   * makes that failure impossible to miss: an inert component writes nothing.
   */
  it('writes to the element, not only to its own fields', async () => {
    const marquee = await render();

    await waitFor(() => marquee.$el.style.getPropertyValue('--marquee-progress') !== '');

    expect(marquee.$el.style.getPropertyValue('--marquee-progress')).not.toBe('');
    expect(marquee.$el.style.getPropertyValue('--marquee-offset')).not.toBe('');
    expect(marquee.$el.style.getPropertyValue('--marquee-velocity')).not.toBe('');
  });

  it('wraps the progress instead of growing without bound', async () => {
    const marquee = await render('data-option-damping="1"');

    // Three loops and a bit in, past where an unwrapped value would be.
    marquee.offset = 3.25;
    marquee.dampedOffset = 3.25;
    await frames(3);

    expect(published(marquee, 'progress')).toBeGreaterThanOrEqual(0);
    expect(published(marquee, 'progress')).toBeLessThan(1);
    // The unwrapped counterpart keeps counting, which is what makes the two
    // properties different things rather than two names for one.
    expect(published(marquee, 'offset')).toBeGreaterThan(3);
  });

  it('reverses with a negative sensitivity', async () => {
    const marquee = await render('data-option-sensitivity="-0.001"');

    await frames(4);

    expect(marquee.offset).toBeLessThan(0);
    // Wrapped from below: a negative offset still lands inside 0…1.
    await waitFor(() => !Number.isNaN(published(marquee, 'progress')));
    expect(published(marquee, 'progress')).toBeGreaterThan(0.5);
    expect(published(marquee, 'progress')).toBeLessThan(1);
  });

  it('boosts the travel with the scroll delta', async () => {
    const marquee = await render('data-option-speed="0" data-option-damping="1"');

    await frames(4);
    expect(marquee.offset).toBe(0);

    marquee.scrolled({ deltaY: 500 } as never);
    await frames(3);

    // 500 px at the default 0.001 loop per pixel is half a loop.
    expect(marquee.offset).toBeCloseTo(0.5, 5);
  });

  it('consumes the scroll delta rather than latching it', async () => {
    const marquee = await render('data-option-speed="0" data-option-damping="1"');

    marquee.scrolled({ deltaY: 500 } as never);
    await frames(3);
    const afterScroll = marquee.offset;

    await frames(6);

    // v1 kept the last delta for ever, so the marquee ran on at the speed of a
    // scroll that had already stopped.
    expect(marquee.offset).toBe(afterScroll);
  });

  it('honours the damping option', async () => {
    const smooth = await render('data-option-speed="0" data-option-damping="0.1"');
    smooth.scrolled({ deltaY: 1000 } as never);
    await frames(2);
    const smoothOffset = smooth.dampedOffset;

    await resetDom();

    const instant = await render('data-option-speed="0" data-option-damping="1"');
    instant.scrolled({ deltaY: 1000 } as never);
    await frames(2);

    // Both accumulated one whole loop; only the follower differs.
    expect(instant.offset).toBeCloseTo(1, 5);
    expect(instant.dampedOffset).toBeCloseTo(1, 5);
    expect(smoothOffset).toBeGreaterThan(0);
    expect(smoothOffset).toBeLessThan(instant.dampedOffset);
  });

  it('stops writing once nothing moves', async () => {
    const marquee = await render('data-option-speed="0" data-option-damping="1"');

    marquee.scrolled({ deltaY: 500 } as never);
    await waitFor(() => published(marquee, 'progress') > 0);
    const settled = published(marquee, 'progress');

    await frames(6);

    expect(published(marquee, 'progress')).toBe(settled);
    expect(marquee.velocity).toBe(0);
  });
});

describe('Marquee — reduced motion', () => {
  it('does not travel on its own when the user asks for less motion', async () => {
    setReducedMotion(true);
    const marquee = await render('data-option-speed="2"');

    await frames(8);

    expect(marquee.offset).toBe(0);
    expect(marquee.dampedOffset).toBe(0);
  });

  it('still follows the scroll, which is the user moving the page', async () => {
    setReducedMotion(true);
    const marquee = await render('data-option-damping="1"');

    marquee.scrolled({ deltaY: 500 } as never);
    await frames(3);

    expect(marquee.offset).toBeCloseTo(0.5, 5);
    expect(published(marquee, 'progress')).toBeCloseTo(0.5, 5);
  });

  it('stops the idle travel when the setting is turned on at runtime', async () => {
    const marquee = await render('data-option-speed="2"');
    await waitFor(() => marquee.offset > 0);

    // The whole point of the subscription: a component that sampled the query
    // once at mount would still be travelling here.
    setReducedMotion(true);
    await frames(3);
    const frozen = marquee.offset;
    await frames(6);

    expect(marquee.offset).toBe(frozen);
  });
});
