import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Track, TrackContext, setTrackDispatcher } from '@studiometa/ui';
import { h, mount, destroy } from '#test-utils';

describe('The TrackContext component', () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  afterEach(() => {
    setTrackDispatcher(null);
  });

  it('should provide context data to child Track components', async () => {
    const contextDiv = h('div', {
      'data-option-data': JSON.stringify({ page: 'home' }),
    });
    const trackDiv = h('div', {
      'data-track:click': JSON.stringify({ action: 'click' }),
    });
    contextDiv.appendChild(trackDiv);

    const context = new TrackContext(contextDiv);
    const track = new Track(trackDiv);
    await mount(context, track);

    track.$el.dispatchEvent(new Event('click'));

    expect(window.dataLayer![0]).toEqual({
      page: 'home',
      action: 'click',
    });

    await destroy(track, context);
  });

  it('should support nested TrackContext components', async () => {
    const outerContext = h('div', {
      'data-option-data': JSON.stringify({ site: 'example.com' }),
    });
    const innerContext = h('div', {
      'data-option-data': JSON.stringify({ page: 'product', product_id: '123' }),
    });
    const trackDiv = h('div', {
      'data-track:click': JSON.stringify({ action: 'add_to_cart' }),
    });

    outerContext.appendChild(innerContext);
    innerContext.appendChild(trackDiv);

    const outer = new TrackContext(outerContext);
    const inner = new TrackContext(innerContext);
    const track = new Track(trackDiv);
    await mount(outer, inner, track);

    track.$el.dispatchEvent(new Event('click'));

    // Track should use closest parent context (inner), not outer
    expect(window.dataLayer![0]).toEqual({
      page: 'product',
      product_id: '123',
      action: 'add_to_cart',
    });

    await destroy(track, inner, outer);
  });

  it('should work without TrackContext parent', async () => {
    const trackDiv = h('div', {
      'data-track:click': JSON.stringify({ event: 'standalone' }),
    });
    const track = new Track(trackDiv);
    await mount(track);

    track.$el.dispatchEvent(new Event('click'));

    expect(window.dataLayer![0]).toEqual({ event: 'standalone' });

    await destroy(track);
  });

  it('should allow Track data to override context data', async () => {
    const contextDiv = h('div', {
      'data-option-data': JSON.stringify({ page: 'home', version: '1' }),
    });
    const trackDiv = h('div', {
      'data-track:click': JSON.stringify({ page: 'override', action: 'click' }),
    });
    contextDiv.appendChild(trackDiv);

    const context = new TrackContext(contextDiv);
    const track = new Track(trackDiv);
    await mount(context, track);

    track.$el.dispatchEvent(new Event('click'));

    expect(window.dataLayer![0]).toEqual({
      page: 'override', // Overridden by Track
      version: '1', // From context
      action: 'click', // From Track
    });

    await destroy(track, context);
  });

  it('should default to empty object when no data option provided', async () => {
    const contextDiv = h('div');
    const trackDiv = h('div', {
      'data-track:click': JSON.stringify({ event: 'test' }),
    });
    contextDiv.appendChild(trackDiv);

    const context = new TrackContext(contextDiv);
    const track = new Track(trackDiv);
    await mount(context, track);

    track.$el.dispatchEvent(new Event('click'));

    expect(window.dataLayer![0]).toEqual({ event: 'test' });

    await destroy(track, context);
  });
});
