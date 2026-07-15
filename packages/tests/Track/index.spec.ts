import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { Track, TrackContext } from '@studiometa/ui';
import type { Base } from '@studiometa/js-toolkit';
import {
  h,
  wait,
  mount,
  mockIsIntersecting,
  intersectionMockInstance,
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
} from '#test-utils';

const COMPONENTS: Record<string, new (el: HTMLElement) => Base> = {
  Track,
  TrackContext,
};

/**
 * Build a DOM tree from an HTML string, instantiate every `[data-component]`
 * element with its matching class and mount them all.
 */
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

/**
 * Get the last payload pushed to `window.dataLayer`.
 */
function lastPush() {
  return window.dataLayer?.at(-1);
}

beforeEach(() => {
  window.dataLayer = [];
});

describe('Track component', () => {
  it('should have the correct config', () => {
    expect(Track.config.name).toBe('Track');
    expect(Track.config.refs).toEqual(['payload']);
  });

  it('should push the resolved payload to window.dataLayer on click', async () => {
    const { root } = await mountTree(
      `<button data-component="Track" data-track:click='{"event": "cta_click", "location": "header"}'></button>`,
    );

    (root.querySelector('button') as HTMLButtonElement).click();

    expect(window.dataLayer).toHaveLength(1);
    expect(lastPush()).toEqual({ event: 'cta_click', location: 'header' });
  });

  it('should keep the event name under the `event` key', async () => {
    const { root } = await mountTree(
      `<button data-component="Track" data-track:click='{"event": "add_to_cart"}'></button>`,
    );

    (root.querySelector('button') as HTMLButtonElement).click();

    expect(lastPush()).toHaveProperty('event', 'add_to_cart');
  });

  describe('bare event name attribute', () => {
    it('should treat a non-JSON attribute value as the event name', async () => {
      const { root } = await mountTree(
        `<button data-component="Track" data-track:click="add_to_cart"></button>`,
      );

      (root.querySelector('button') as HTMLButtonElement).click();

      expect(lastPush()).toEqual({ event: 'add_to_cart' });
    });

    it('should merge the bare event name with the context and base payload', async () => {
      const { root } = await mountTree(`
        <div data-component="TrackContext" data-option-context='{"page_type": "product"}'>
          <button
            data-component="Track"
            data-track:click="add_to_cart"
            data-option-payload='{"location": "footer"}'></button>
        </div>
      `);

      (root.querySelector('button') as HTMLButtonElement).click();

      expect(lastPush()).toEqual({
        page_type: 'product',
        location: 'footer',
        event: 'add_to_cart',
      });
    });
  });

  describe('data-option-payload', () => {
    it('should use the `payload` option as the base payload', async () => {
      const { root } = await mountTree(
        `<button
          data-component="Track"
          data-track:click='{"event": "cta"}'
          data-option-payload='{"location": "header", "id": "1"}'></button>`,
      );

      (root.querySelector('button') as HTMLButtonElement).click();

      expect(lastPush()).toEqual({ event: 'cta', location: 'header', id: '1' });
    });

    it('should let the `payload` option override the `payload` ref', async () => {
      const { root } = await mountTree(`
        <button
          data-component="Track"
          data-track:click='{"event": "cta"}'
          data-option-payload='{"source": "option"}'>
          <script data-ref="payload" type="application/json">{ "source": "ref", "kept": true }</script>
        </button>
      `);

      (root.querySelector('button') as HTMLButtonElement).click();

      // Option wins on conflicts; non-conflicting ref keys are kept.
      expect(lastPush()).toEqual({ event: 'cta', source: 'option', kept: true });
    });

    it('should let the per-event attribute override the `payload` option', async () => {
      const { root } = await mountTree(
        `<button
          data-component="Track"
          data-track:click='{"event": "cta", "location": "event"}'
          data-option-payload='{"location": "option"}'></button>`,
      );

      (root.querySelector('button') as HTMLButtonElement).click();

      expect(lastPush()).toEqual({ event: 'cta', location: 'event' });
    });
  });

  it('should merge the deep-merged context of every ancestor TrackContext, nearer wins', async () => {
    // PDP > Variant > Track tree.
    const { root } = await mountTree(`
      <div data-component="TrackContext" data-option-context='{"page_type": "product", "currency": "EUR", "product_id": "pdp"}'>
        <div data-component="TrackContext" data-option-context='{"variant_id": "v1", "product_id": "variant"}'>
          <button data-component="Track" data-track:click='{"event": "add_to_cart"}'></button>
        </div>
      </div>
    `);

    (root.querySelector('button') as HTMLButtonElement).click();

    expect(lastPush()).toEqual({
      page_type: 'product',
      currency: 'EUR',
      // The nearer TrackContext (Variant) overrides the outer one (PDP).
      product_id: 'variant',
      variant_id: 'v1',
      event: 'add_to_cart',
    });
  });

  it('should REPLACE arrays on merge instead of concatenating them', async () => {
    const { root } = await mountTree(`
      <div data-component="TrackContext" data-option-context='{"ecommerce": {"items": [{"id": "from-context"}]}}'>
        <button data-component="Track" data-track:click='{"event": "select_item", "ecommerce": {"items": [{"id": "from-event"}]}}'></button>
      </div>
    `);

    (root.querySelector('button') as HTMLButtonElement).click();

    const { ecommerce } = lastPush() as { ecommerce: { items: unknown[] } };
    expect(ecommerce.items).toEqual([{ id: 'from-event' }]);
    expect(ecommerce.items).toHaveLength(1);
  });

  it('should apply payload precedence: context < payload ref < per-event attribute', async () => {
    const { root } = await mountTree(`
      <div data-component="TrackContext" data-option-context='{"value": "context", "from_context": true}'>
        <button data-component="Track" data-track:click='{"event": "x", "value": "event"}'>
          <script data-ref="payload" type="application/json">{ "value": "payload", "from_payload": true }</script>
        </button>
      </div>
    `);

    (root.querySelector('button') as HTMLButtonElement).click();

    expect(lastPush()).toEqual({
      // The per-event attribute wins over the payload ref and the context.
      value: 'event',
      from_context: true,
      from_payload: true,
      event: 'x',
    });
  });

  it('should let the payload ref win over the context', async () => {
    const { root } = await mountTree(`
      <div data-component="TrackContext" data-option-context='{"value": "context"}'>
        <button data-component="Track" data-track:click='{"event": "x"}'>
          <script data-ref="payload" type="application/json">{ "value": "payload" }</script>
        </button>
      </div>
    `);

    (root.querySelector('button') as HTMLButtonElement).click();

    expect(lastPush()).toHaveProperty('value', 'payload');
  });

  it('should fire every data-track:* event declared on one element', async () => {
    const { root } = await mountTree(
      `<button
        data-component="Track"
        data-track:click='{"event": "click_event"}'
        data-track:mousedown='{"event": "mousedown_event"}'></button>`,
    );

    const button = root.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new Event('mousedown'));
    button.click();

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer?.map((entry) => entry.event)).toEqual([
      'mousedown_event',
      'click_event',
    ]);
  });

  it('should fire an event with an empty data-track:<event> value', async () => {
    const { root } = await mountTree(`
      <div data-component="TrackContext" data-option-context='{"page_type": "home"}'>
        <button data-component="Track" data-track:click=""></button>
      </div>
    `);

    (root.querySelector('button') as HTMLButtonElement).click();

    expect(lastPush()).toEqual({ page_type: 'home' });
  });

  describe('mounted event', () => {
    it('should dispatch on mount with the resolved context', async () => {
      await mountTree(`
        <div data-component="TrackContext" data-option-context='{"page_type": "home"}'>
          <div data-component="Track" data-track:mounted='{"event": "page_view"}'></div>
        </div>
      `);

      // The mounted dispatch is deferred to the next frame.
      await wait(50);

      expect(lastPush()).toEqual({ page_type: 'home', event: 'page_view' });
    });

    it('should still see an ancestor TrackContext mounted just after the child (mount-order tolerance)', async () => {
      const root = h('div');
      root.innerHTML = `
        <div data-component="TrackContext" data-option-context='{"page_type": "product"}'>
          <div data-component="Track" data-track:mounted='{"event": "page_view"}'></div>
        </div>`;

      const contextEl = root.querySelector('[data-component="TrackContext"]') as HTMLElement;
      const trackEl = root.querySelector('[data-component="Track"]') as HTMLElement;

      // Mount the child Track BEFORE its ancestor TrackContext instance even
      // exists, so the context can only be resolved through the next-frame
      // deferral (a synchronous dispatch would find no TrackContext).
      const track = new Track(trackEl);
      await track.$mount();

      const context = new TrackContext(contextEl);
      await context.$mount();

      // The next-frame deferral lets the late ancestor be resolved.
      await wait(50);

      expect(lastPush()).toEqual({ page_type: 'product', event: 'page_view' });
    });

    it('should not dispatch when destroyed before the deferred mounted frame', async () => {
      const root = h('div');
      root.innerHTML = `<div data-component="Track" data-track:mounted='{"event": "page_view"}'></div>`;
      const el = root.querySelector('[data-component="Track"]') as HTMLElement;

      const track = new Track(el);
      await track.$mount();
      // Destroy within the same frame, before the deferred send runs.
      await track.$destroy();

      await wait(50);

      // The $isMounted guard prevents a dispatch for the unmounted component.
      expect(window.dataLayer ?? []).toHaveLength(0);
    });
  });

  describe('view event (IntersectionObserver)', () => {
    beforeAll(() => {
      intersectionObserverBeforeAllCallback();
    });

    afterEach(() => {
      intersectionObserverAfterEachCallback();
    });

    it('should dispatch when the element becomes visible', async () => {
      const { root } = await mountTree(
        `<div data-component="Track" data-track:view='{"event": "product_impression", "id": "123"}'></div>`,
      );

      const el = root.querySelector('[data-component="Track"]') as HTMLElement;
      await mockIsIntersecting(el, true);

      expect(lastPush()).toEqual({ event: 'product_impression', id: '123' });
    });

    it('should dispatch on every intersection without the .once modifier', async () => {
      const { root } = await mountTree(
        `<div data-component="Track" data-track:view='{"event": "impression"}'></div>`,
      );

      const el = root.querySelector('[data-component="Track"]') as HTMLElement;
      await mockIsIntersecting(el, true);
      await mockIsIntersecting(el, false);
      await mockIsIntersecting(el, true);

      expect(window.dataLayer).toHaveLength(2);
    });

    it('should dispatch once and disconnect with the .once modifier', async () => {
      const { root } = await mountTree(
        `<div data-component="Track" data-track:view.once='{"event": "impression"}'></div>`,
      );

      const el = root.querySelector('[data-component="Track"]') as HTMLElement;
      const observer = intersectionMockInstance(el);

      await mockIsIntersecting(el, true);

      expect(window.dataLayer).toHaveLength(1);
      expect(observer.disconnect).toHaveBeenCalled();
    });

    it('should dispatch on any visibility, even a ratio below the threshold (tall element)', async () => {
      const { root } = await mountTree(
        `<div data-component="Track" data-option-threshold="0.5" data-track:view='{"event": "impression"}'></div>`,
      );

      const el = root.querySelector('[data-component="Track"]') as HTMLElement;
      // A tall element that can only ever be 20% visible: isIntersecting is
      // true but the ratio stays below the threshold. It must still dispatch.
      await mockIsIntersecting(el, true, 0.2);

      expect(window.dataLayer).toHaveLength(1);
    });

    it('should apply timing modifiers to the view event', async () => {
      const { root } = await mountTree(
        `<div data-component="Track" data-track:view.throttle1000='{"event": "impression"}'></div>`,
      );

      const el = root.querySelector('[data-component="Track"]') as HTMLElement;
      // Three intersections well within the throttle window: only the leading
      // dispatch goes through.
      await mockIsIntersecting(el, true);
      await mockIsIntersecting(el, false);
      await mockIsIntersecting(el, true);

      expect(window.dataLayer).toHaveLength(1);
    });
  });

  describe('lifecycle', () => {
    it('should not dispatch a `.capture` event after destroy, and resume after remount', async () => {
      window.dataLayer = [];
      const { root, instances } = await mountTree(
        `<div data-component="Track" data-track:click.capture='{"event": "cta"}'></div>`,
      );
      const el = root.querySelector('[data-component="Track"]') as HTMLElement;

      el.click();
      expect(window.dataLayer).toHaveLength(1);

      await instances[0].$destroy();
      el.click();
      // The capture listener was removed and dispatch is guarded — no new push.
      expect(window.dataLayer).toHaveLength(1);

      await instances[0].$mount();
      el.click();
      // Re-attaching after remount resumes dispatching.
      expect(window.dataLayer).toHaveLength(2);
    });
  });

  describe('payload isolation and memoization', () => {
    it('should not share the array instance across dispatches', async () => {
      const { root } = await mountTree(
        `<button data-component="Track" data-track:click='{"event": "e", "items": [1, 2]}'></button>`,
      );
      const button = root.querySelector('button') as HTMLButtonElement;

      button.click();
      // A consumer mutates the pushed array in place.
      (window.dataLayer.at(-1) as { items: number[] }).items.push(99);

      button.click();
      // The second dispatch is unaffected by the mutation of the first.
      expect((window.dataLayer.at(-1) as { items: number[] }).items).toEqual([1, 2]);
    });

    it('should resolve the ancestor context only once across dispatches', async () => {
      const { root, instances } = await mountTree(`
        <div data-component="TrackContext" data-option-context='{"page_type": "product"}'>
          <button data-component="Track" data-track:click="cta"></button>
        </div>
      `);
      const track = instances.find((i) => i instanceof Track) as Track;
      const spy = vi.spyOn(track, '$closest');

      const button = root.querySelector('button') as HTMLButtonElement;
      button.click();
      button.click();
      button.click();

      // Context is memoized: the ancestor chain is walked once, not per click.
      expect(spy).toHaveBeenCalledTimes(1);
      expect(lastPush()).toEqual({ page_type: 'product', event: 'cta' });
      spy.mockRestore();
    });
  });

  describe('malformed JSON tolerance', () => {
    it('should not throw when the data-track:<event> value is invalid JSON', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { root } = await mountTree(
        `<button data-component="Track" data-option-log data-track:click='{ not json }'></button>`,
      );

      const button = root.querySelector('button') as HTMLButtonElement;
      expect(() => button.click()).not.toThrow();
      // The malformed event was dropped, nothing was dispatched.
      expect(window.dataLayer).toHaveLength(0);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should fall back to an empty payload when the payload ref is invalid JSON', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { root } = await mountTree(`
        <button data-component="Track" data-option-log data-track:click='{"event": "x"}'>
          <script data-ref="payload" type="application/json">{ broken </script>
        </button>
      `);

      (root.querySelector('button') as HTMLButtonElement).click();

      expect(lastPush()).toEqual({ event: 'x' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should fall back to an empty payload when data-option-payload is invalid JSON', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { root } = await mountTree(
        `<button
          data-component="Track"
          data-option-log
          data-track:click='{"event": "x"}'
          data-option-payload='{ not json }'></button>`,
      );

      const button = root.querySelector('button') as HTMLButtonElement;
      expect(() => button.click()).not.toThrow();
      expect(lastPush()).toEqual({ event: 'x' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
