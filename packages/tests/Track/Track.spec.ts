import { describe, it, vi, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { Track, TrackContext, setTrackDispatcher } from '@studiometa/ui';
import {
  h,
  mount,
  destroy,
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
  mockIsIntersecting,
} from '#test-utils';

describe('The Track component', () => {
  let dispatcherSpy: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    intersectionObserverBeforeAllCallback();
  });

  beforeEach(() => {
    // Reset dataLayer
    window.dataLayer = [];
    // Create spy for custom dispatcher
    dispatcherSpy = vi.fn();
  });

  afterEach(() => {
    intersectionObserverAfterEachCallback();
    setTrackDispatcher(null);
  });

  it('should dispatch on click event', async () => {
    const div = h('div', {
      'data-on:click': JSON.stringify({ event: 'cta_click', location: 'header' }),
    });
    const track = new Track(div);
    await mount(track);

    track.$el.dispatchEvent(new Event('click'));

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer![0]).toEqual({ event: 'cta_click', location: 'header' });

    await destroy(track);
  });

  it('should dispatch on mounted event', async () => {
    const div = h('div', {
      'data-on:mounted': JSON.stringify({ event: 'page_view', page: 'home' }),
    });
    const track = new Track(div);
    await mount(track);

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer![0]).toEqual({ event: 'page_view', page: 'home' });

    await destroy(track);
  });

  it('should dispatch on view event with IntersectionObserver', async () => {
    const div = h('div', {
      'data-on:view': JSON.stringify({ event: 'product_impression', id: '123' }),
    });
    const track = new Track(div);
    await mount(track);

    // Initially not intersecting
    expect(window.dataLayer).toHaveLength(0);

    // Trigger intersection
    await mockIsIntersecting(track.$el, true);

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer![0]).toEqual({ event: 'product_impression', id: '123' });

    await destroy(track);
  });

  it('should dispatch only once with .once modifier on view event', async () => {
    const div = h('div', {
      'data-on:view.once': JSON.stringify({ event: 'product_impression', id: '123' }),
    });
    const track = new Track(div);
    await mount(track);

    // Trigger intersection - should dispatch once then disconnect
    await mockIsIntersecting(track.$el, true);

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer![0]).toEqual({ event: 'product_impression', id: '123' });

    await destroy(track);
  });

  it('should support multiple events on same element', async () => {
    const div = h('div', {
      'data-on:click': JSON.stringify({ event: 'click_event' }),
      'data-on:mouseenter': JSON.stringify({ event: 'hover_event' }),
    });
    const track = new Track(div);
    await mount(track);

    track.$el.dispatchEvent(new Event('click'));
    track.$el.dispatchEvent(new Event('mouseenter'));

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer![0]).toEqual({ event: 'click_event' });
    expect(window.dataLayer![1]).toEqual({ event: 'hover_event' });

    await destroy(track);
  });

  it('should use custom dispatcher when set', async () => {
    setTrackDispatcher(dispatcherSpy);

    const div = h('div', {
      'data-on:click': JSON.stringify({ event: 'test_event' }),
    });
    const track = new Track(div);
    await mount(track);

    track.$el.dispatchEvent(new Event('click'));

    expect(dispatcherSpy).toHaveBeenCalledTimes(1);
    expect(dispatcherSpy).toHaveBeenCalledWith(
      { event: 'test_event' },
      expect.any(Event),
    );
    // Default dataLayer should not be used
    expect(window.dataLayer).toHaveLength(0);

    await destroy(track);
  });

  it('should merge context data from TrackContext parent', async () => {
    const contextDiv = h('div', {
      'data-option-data': JSON.stringify({ page_type: 'product', product_id: '123' }),
    });
    const trackDiv = h('div', {
      'data-on:click': JSON.stringify({ action: 'add_to_cart' }),
    });
    contextDiv.appendChild(trackDiv);

    const context = new TrackContext(contextDiv);
    const track = new Track(trackDiv);
    await mount(context, track);

    track.$el.dispatchEvent(new Event('click'));

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer![0]).toEqual({
      page_type: 'product',
      product_id: '123',
      action: 'add_to_cart',
    });

    await destroy(track, context);
  });

  it('should apply .prevent modifier', async () => {
    const div = h('div', {
      'data-on:click.prevent': JSON.stringify({ event: 'test' }),
    });
    const track = new Track(div);
    await mount(track);

    const event = new Event('click', { cancelable: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    track.$el.dispatchEvent(event);

    expect(preventSpy).toHaveBeenCalledTimes(1);

    await destroy(track);
  });

  it('should apply .stop modifier', async () => {
    const div = h('div', {
      'data-on:click.stop': JSON.stringify({ event: 'test' }),
    });
    const track = new Track(div);
    await mount(track);

    const event = new Event('click', { bubbles: true });
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    track.$el.dispatchEvent(event);

    expect(stopSpy).toHaveBeenCalledTimes(1);

    await destroy(track);
  });

  it('should warn on invalid JSON', async () => {
    const div = h('div', {
      'data-on:click': 'invalid json',
    });
    const track = new Track(div);
    // $warn is a getter, so we spy on it with 'get'
    const warnFn = vi.fn();
    vi.spyOn(track, '$warn', 'get').mockReturnValue(warnFn);
    await mount(track);

    expect(warnFn).toHaveBeenCalled();

    await destroy(track);
  });

  it('should handle CustomEvent with $detail.* placeholders', async () => {
    const div = h('div', {
      'data-on:form-submitted': JSON.stringify({
        event: 'form_submitted',
        email: '$detail.email',
        name: '$detail.user.name',
      }),
    });
    const track = new Track(div);
    await mount(track);

    const customEvent = new CustomEvent('form-submitted', {
      detail: {
        email: 'test@example.com',
        user: { name: 'John' },
      },
    });
    track.$el.dispatchEvent(customEvent);

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer![0]).toEqual({
      event: 'form_submitted',
      email: 'test@example.com',
      name: 'John',
    });

    await destroy(track);
  });

  it('should debounce events with default delay', async () => {
    const div = h('div', {
      'data-on:input.debounce': JSON.stringify({ event: 'search_input' }),
    });
    const track = new Track(div);
    await mount(track);

    // Enable fake timers after mounting
    vi.useFakeTimers();

    // Trigger multiple events quickly
    track.$el.dispatchEvent(new Event('input'));
    track.$el.dispatchEvent(new Event('input'));
    track.$el.dispatchEvent(new Event('input'));

    // Should not be called immediately
    expect(window.dataLayer).toHaveLength(0);

    // Fast forward 150ms (less than default 300ms)
    vi.advanceTimersByTime(150);
    expect(window.dataLayer).toHaveLength(0);

    // Fast forward another 150ms (total 300ms)
    vi.advanceTimersByTime(150);
    expect(window.dataLayer).toHaveLength(1);

    vi.useRealTimers();
    await destroy(track);
  });

  it('should debounce events with custom delay', async () => {
    const div = h('div', {
      'data-on:input.debounce500': JSON.stringify({ event: 'search_input' }),
    });
    const track = new Track(div);
    await mount(track);

    // Enable fake timers after mounting
    vi.useFakeTimers();

    track.$el.dispatchEvent(new Event('input'));

    // Should not be called after 300ms
    vi.advanceTimersByTime(300);
    expect(window.dataLayer).toHaveLength(0);

    // Should be called after 500ms total
    vi.advanceTimersByTime(200);
    expect(window.dataLayer).toHaveLength(1);

    vi.useRealTimers();
    await destroy(track);
  });

  it('should throttle events with default delay', async () => {
    const div = h('div', {
      'data-on:scroll.throttle': JSON.stringify({ event: 'scroll_tracking' }),
    });
    const track = new Track(div);
    await mount(track);

    // Enable fake timers after mounting
    vi.useFakeTimers();

    // First event should fire immediately (throttle behavior)
    track.$el.dispatchEvent(new Event('scroll'));
    expect(window.dataLayer).toHaveLength(1);

    // Subsequent events within throttle window should be ignored
    track.$el.dispatchEvent(new Event('scroll'));
    track.$el.dispatchEvent(new Event('scroll'));
    expect(window.dataLayer).toHaveLength(1);

    // After throttle delay, next event should fire
    vi.advanceTimersByTime(16);
    track.$el.dispatchEvent(new Event('scroll'));
    expect(window.dataLayer).toHaveLength(2);

    vi.useRealTimers();
    await destroy(track);
  });
});
