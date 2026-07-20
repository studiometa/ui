import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TrackShopify, TrackContext } from '@studiometa/ui';
import type { Base } from '@studiometa/js-toolkit';
import { h, mount } from '#test-utils';

const COMPONENTS: Record<string, new (el: HTMLElement) => Base> = {
  TrackShopify,
  TrackContext,
};

async function mountTree(html: string) {
  const root = h('div');
  root.innerHTML = html;

  const instances: Base[] = [];
  for (const el of Array.from(root.querySelectorAll('[data-component]'))) {
    const name = el.getAttribute('data-component');
    const Ctor = COMPONENTS[name];
    instances.push(new Ctor(el as HTMLElement));
  }

  await mount(...instances);

  return { root, instances };
}

beforeEach(() => {
  delete window.Shopify;
});

afterEach(() => {
  delete window.Shopify;
});

describe('TrackShopify component', () => {
  it('should have the correct config', () => {
    expect(TrackShopify.config.name).toBe('TrackShopify');
  });

  it('should publish through window.Shopify.analytics.publish with the event name and payload', async () => {
    const publish = vi.fn();
    const analytics = { publish };
    window.Shopify = { analytics };

    const { root } = await mountTree(`
      <div data-component="TrackContext" data-option-context='{"page_type": "product"}'>
        <button data-component="TrackShopify" data-track:click='{"event": "add_to_cart", "product_id": "123"}'></button>
      </div>
    `);

    (root.querySelector('button') as HTMLButtonElement).click();

    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith('add_to_cart', {
      page_type: 'product',
      event: 'add_to_cart',
      product_id: '123',
    });
    // The first argument is the payload's `event` key.
    const [name, payload] = publish.mock.calls[0];
    expect(name).toBe((payload as { event: string }).event);
  });

  it('should call publish bound to window.Shopify.analytics', async () => {
    const publish = vi.fn();
    const analytics = { publish };
    window.Shopify = { analytics };

    const { root } = await mountTree(
      `<button data-component="TrackShopify" data-track:click='{"event": "view"}'></button>`,
    );

    (root.querySelector('button') as HTMLButtonElement).click();

    // `this` inside publish must be the analytics object.
    expect(publish.mock.instances[0]).toBe(analytics);
  });

  it('should warn and not throw when the Shopify analytics API is absent', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // window.Shopify is undefined (cleared in beforeEach).
    const { root } = await mountTree(
      `<button data-component="TrackShopify" data-option-log data-track:click='{"event": "add_to_cart"}'></button>`,
    );

    const button = root.querySelector('button') as HTMLButtonElement;
    expect(() => button.click()).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should warn and not publish when the payload has no string `event` name', async () => {
    const publish = vi.fn();
    window.Shopify = { analytics: { publish } };
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { root } = await mountTree(
      `<button data-component="TrackShopify" data-option-log data-track:click='{"product_id": "123"}'></button>`,
    );
    (root.querySelector('button') as HTMLButtonElement).click();

    expect(publish).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should warn and not throw when publish is not a function', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.Shopify = { analytics: {} };

    const { root } = await mountTree(
      `<button data-component="TrackShopify" data-option-log data-track:click='{"event": "add_to_cart"}'></button>`,
    );

    const button = root.querySelector('button') as HTMLButtonElement;
    expect(() => button.click()).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
