import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Track } from '@studiometa/ui';
import { h } from '#test-utils';

async function mountTrack(el: HTMLElement) {
  const track = new Track(el);
  await track.$mount();
  return track;
}

function lastPush() {
  return window.dataLayer?.at(-1);
}

beforeEach(() => {
  window.dataLayer = [];
});

describe('TrackEvent custom event handling', () => {
  it('should resolve `$detail.*` placeholders from the event detail', async () => {
    const el = h('div', {
      dataComponent: 'Track',
      'data-track:form-submitted': JSON.stringify({
        event: 'form_submitted',
        email: '$detail.email',
        name: '$detail.user.name',
      }),
    });
    await mountTrack(el);

    el.dispatchEvent(
      new CustomEvent('form-submitted', {
        detail: { email: 'test@example.com', user: { name: 'John' } },
      }),
    );

    expect(lastPush()).toEqual({
      event: 'form_submitted',
      email: 'test@example.com',
      name: 'John',
    });
  });

  it('should resolve `$detail.*` placeholders nested inside arrays', async () => {
    const el = h('div', {
      dataComponent: 'Track',
      'data-track:add-to-cart': JSON.stringify({
        event: 'add_to_cart',
        ecommerce: {
          items: [{ item_id: '$detail.id', price: '$detail.price' }],
        },
      }),
    });
    await mountTrack(el);

    el.dispatchEvent(new CustomEvent('add-to-cart', { detail: { id: 'SKU1', price: 29.9 } }));

    expect(lastPush()).toEqual({
      event: 'add_to_cart',
      ecommerce: { items: [{ item_id: 'SKU1', price: 29.9 }] },
    });
  });

  it('should treat a falsy CustomEvent detail as empty (no literal placeholder leak)', async () => {
    const el = h('div', {
      dataComponent: 'Track',
      'data-track:ping': JSON.stringify({ event: 'ping', value: '$detail.value' }),
    });
    await mountTrack(el);

    el.dispatchEvent(new CustomEvent('ping', { detail: 0 }));

    // The placeholder resolves to undefined, never the literal "$detail.value".
    const push = lastPush() as Record<string, unknown>;
    expect(push.event).toBe('ping');
    expect(push.value).toBeUndefined();
  });

  it('should merge the full event detail with the `.detail` modifier', async () => {
    const el = h('div', {
      dataComponent: 'Track',
      'data-track:custom-event.detail': JSON.stringify({ event: 'custom' }),
    });
    await mountTrack(el);

    el.dispatchEvent(
      new CustomEvent('custom-event', {
        detail: { foo: 'bar', count: 2 },
      }),
    );

    expect(lastPush()).toEqual({ event: 'custom', foo: 'bar', count: 2 });
  });
});

describe('TrackEvent timing modifiers', () => {
  it('should debounce the dispatch with a custom delay', async () => {
    const el = h('div', {
      dataComponent: 'Track',
      'data-track:input.debounce500': JSON.stringify({ event: 'search_input' }),
    });
    await mountTrack(el);

    vi.useFakeTimers();
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('input'));

    // Nothing dispatched before the delay elapses.
    expect(window.dataLayer).toHaveLength(0);

    vi.advanceTimersByTime(500);

    // Only a single, trailing dispatch after the delay.
    expect(window.dataLayer).toHaveLength(1);
    expect(lastPush()).toEqual({ event: 'search_input' });
    vi.useRealTimers();
  });

  it('should throttle the dispatch with a custom delay', async () => {
    const el = h('div', {
      dataComponent: 'Track',
      'data-track:scroll.throttle200': JSON.stringify({ event: 'scroll_depth' }),
    });
    await mountTrack(el);

    vi.useFakeTimers();
    el.dispatchEvent(new Event('scroll'));
    // Leading edge dispatches immediately.
    expect(window.dataLayer).toHaveLength(1);

    el.dispatchEvent(new Event('scroll'));
    el.dispatchEvent(new Event('scroll'));
    // Still throttled within the window.
    expect(window.dataLayer).toHaveLength(1);

    vi.advanceTimersByTime(200);
    el.dispatchEvent(new Event('scroll'));
    expect(window.dataLayer.length).toBeGreaterThanOrEqual(2);
    vi.useRealTimers();
  });
});
