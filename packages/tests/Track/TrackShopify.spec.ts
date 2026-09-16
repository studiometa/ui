import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, mount, resetDom } from '@studiometa/js-toolkit/test';
import { TrackContext } from '#private/Track/TrackContext.js';
import { TrackShopify } from '#private/Track/TrackShopify.js';

registerComponents(TrackContext, TrackShopify);

/** The spy standing in for `window.Shopify.analytics.publish`. */
let publish: ReturnType<typeof vi.fn>;

/**
 * Install a Shopify global.
 *
 * `allowed` is the `analyticsProcessingAllowed` implementation. The component
 * calls it on every dispatch, so a test can flip consent between two events
 * the way a consent banner does. Omit it to leave the Customer Privacy API
 * absent, which is the state of a page whose `loadFeatures()` has not resolved.
 */
function stubShopify({ allowed }: { allowed?: () => boolean } = {}): void {
  window.Shopify = {
    analytics: { publish },
    ...(allowed ? { customerPrivacy: { analyticsProcessingAllowed: allowed } } : {}),
  };
}

beforeEach(() => {
  publish = vi.fn();
});

afterEach(async () => {
  delete window.Shopify;
  await resetDom();
});

describe('TrackShopify — consent', () => {
  it('publishes when analytics processing is allowed', async () => {
    stubShopify({ allowed: () => true });

    const root = await mount(`
      <div data-component="TrackContext" data-option-context='{"page_type": "product"}'>
        <button data-component="TrackShopify" data-track:click='{"event": "add_to_cart", "id": "1"}'></button>
      </div>
    `);
    root.querySelector('button')?.click();

    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith('add_to_cart', {
      page_type: 'product',
      event: 'add_to_cart',
      id: '1',
    });
  });

  it('publishes nothing when analytics processing is denied', async () => {
    stubShopify({ allowed: () => false });
    const log = captureDiagnostics();

    const root = await mount(
      `<button data-component="TrackShopify" data-track:click='{"event": "add_to_cart"}'></button>`,
    );
    root.querySelector('button')?.click();

    expect(publish).not.toHaveBeenCalled();
    expect(log.codes).toContain('track.shopify-consent-denied');
    log.stop();
  });

  it('publishes nothing when the customer privacy API is absent', async () => {
    stubShopify();
    const log = captureDiagnostics();

    const root = await mount(
      `<button data-component="TrackShopify" data-track:click='{"event": "add_to_cart"}'></button>`,
    );
    root.querySelector('button')?.click();

    expect(publish).not.toHaveBeenCalled();
    expect(log.codes).toContain('track.shopify-privacy-unavailable');
    log.stop();
  });

  it('publishes nothing when the customer privacy API carries no `analyticsProcessingAllowed`', async () => {
    window.Shopify = { analytics: { publish }, customerPrivacy: {} };
    const log = captureDiagnostics();

    const root = await mount(
      `<button data-component="TrackShopify" data-track:click='{"event": "add_to_cart"}'></button>`,
    );
    root.querySelector('button')?.click();

    expect(publish).not.toHaveBeenCalled();
    expect(log.codes).toContain('track.shopify-privacy-unavailable');
    log.stop();
  });

  it('follows a consent change without a remount', async () => {
    let allowed = false;
    stubShopify({ allowed: () => allowed });
    const log = captureDiagnostics();

    const root = await mount(
      `<button data-component="TrackShopify" data-track:click='{"event": "add_to_cart"}'></button>`,
    );
    const button = root.querySelector('button') as HTMLButtonElement;

    button.click();
    expect(publish).not.toHaveBeenCalled();

    allowed = true;
    button.click();
    expect(publish).toHaveBeenCalledTimes(1);

    allowed = false;
    button.click();
    expect(publish).toHaveBeenCalledTimes(1);

    log.stop();
  });

  it('sees a customer privacy API that appears after mount', async () => {
    stubShopify();
    const log = captureDiagnostics();

    const root = await mount(
      `<button data-component="TrackShopify" data-track:click='{"event": "add_to_cart"}'></button>`,
    );
    const button = root.querySelector('button') as HTMLButtonElement;

    button.click();
    expect(publish).not.toHaveBeenCalled();

    // What `loadFeatures()` does once the Customer Privacy API has loaded.
    window.Shopify!.customerPrivacy = { analyticsProcessingAllowed: () => true };
    button.click();

    expect(publish).toHaveBeenCalledTimes(1);
    log.stop();
  });

  it('does not replay an event dropped before consent was granted', async () => {
    let allowed = false;
    stubShopify({ allowed: () => allowed });
    const log = captureDiagnostics();

    const root = await mount(`
      <button data-component="TrackShopify" data-track:click='{"event": "add_to_cart"}'></button>
      <button data-component="TrackShopify" data-track:click='{"event": "begin_checkout"}'></button>
    `);
    const [dropped, sent] = Array.from(root.querySelectorAll('button'));

    dropped.click();
    allowed = true;
    sent.click();

    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith('begin_checkout', { event: 'begin_checkout' });
    log.stop();
  });

  it('adds no customer identifier to the published payload', async () => {
    stubShopify({ allowed: () => true });

    const root = await mount(`
      <div data-component="TrackContext" data-option-context='{"page_type": "product"}'>
        <button data-component="TrackShopify" data-track:click='{"event": "add_to_cart"}'></button>
      </div>
    `);
    root.querySelector('button')?.click();

    const [name, payload] = publish.mock.calls[0] as [string, Record<string, unknown>];
    expect(name).toBe('add_to_cart');
    // An exact match: the payload holds the declared layers and nothing else.
    expect(payload).toEqual({ page_type: 'product', event: 'add_to_cart' });
  });
});

describe('TrackShopify — the dispatch seam', () => {
  it('publishes nothing and does not throw when the analytics API is absent', async () => {
    const log = captureDiagnostics();
    const root = await mount(
      `<button data-component="TrackShopify" data-track:click='{"event": "x"}'></button>`,
    );

    expect(() => root.querySelector('button')?.click()).not.toThrow();
    expect(log.codes).toContain('track.shopify-unavailable');
    log.stop();
  });

  it('publishes nothing without a string `event` name', async () => {
    stubShopify({ allowed: () => true });
    const log = captureDiagnostics();

    const root = await mount(
      `<button data-component="TrackShopify" data-track:click='{"id": "1"}'></button>`,
    );
    root.querySelector('button')?.click();

    expect(publish).not.toHaveBeenCalled();
    expect(log.codes).toContain('track.missing-event-name');
    log.stop();
  });

  it('reports a missing `event` name even while consent is denied', async () => {
    stubShopify({ allowed: () => false });
    const log = captureDiagnostics();

    const root = await mount(
      `<button data-component="TrackShopify" data-track:click='{"id": "1"}'></button>`,
    );
    root.querySelector('button')?.click();

    expect(publish).not.toHaveBeenCalled();
    // The declaration is broken for every visitor, so it is reported before
    // the consent drop instead of being masked by it.
    expect(log.codes).toContain('track.missing-event-name');
    expect(log.codes).not.toContain('track.shopify-consent-denied');
    log.stop();
  });

  it('keeps `this` bound to window.Shopify.analytics when publishing', async () => {
    let receiver: unknown;
    window.Shopify = {
      analytics: {
        publish(...args: [string, Record<string, unknown>]) {
          receiver = this;
          publish(...args);
        },
      },
      customerPrivacy: { analyticsProcessingAllowed: () => true },
    };

    const root = await mount(
      `<button data-component="TrackShopify" data-track:click='{"event": "add_to_cart"}'></button>`,
    );
    root.querySelector('button')?.click();

    expect(publish).toHaveBeenCalledTimes(1);
    expect(receiver).toBe(window.Shopify?.analytics);
  });

  it('never touches window.dataLayer', async () => {
    stubShopify({ allowed: () => true });
    window.dataLayer = [];

    const root = await mount(
      `<button data-component="TrackShopify" data-track:click='{"event": "add_to_cart"}'></button>`,
    );
    root.querySelector('button')?.click();

    expect(publish).toHaveBeenCalledTimes(1);
    expect(window.dataLayer).toHaveLength(0);
  });
});
