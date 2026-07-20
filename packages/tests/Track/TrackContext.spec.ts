import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Track, TrackContext } from '@studiometa/ui';
import type { Base } from '@studiometa/js-toolkit';
import { h, mount } from '#test-utils';

const COMPONENTS: Record<string, new (el: HTMLElement) => Base> = {
  Track,
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

/**
 * Resolve the merged context seen by a Track nested under the given HTML by
 * clicking it and reading the payload pushed to `window.dataLayer`.
 */
async function resolveContext(contextHtml: string) {
  window.dataLayer = [];
  const { root } = await mountTree(`
    ${contextHtml.replace(
      '</section>',
      `<button data-component="Track" data-track:click='{"event": "probe"}'></button></section>`,
    )}
  `);
  (root.querySelector('button') as HTMLButtonElement).click();
  const payload = { ...(window.dataLayer.at(-1) as Record<string, unknown>) };
  delete payload.event;
  return payload;
}

beforeEach(() => {
  window.dataLayer = [];
});

describe('TrackContext component', () => {
  it('should have the correct config', () => {
    expect(TrackContext.config.name).toBe('TrackContext');
    expect(TrackContext.config.refs).toEqual(['context']);
  });

  describe('context sources', () => {
    it('should read the context from the `context` script ref only', async () => {
      const context = await resolveContext(`
        <section data-component="TrackContext">
          <script data-ref="context" type="application/json">{ "page_type": "product", "id": "123" }</script>
        </section>
      `);

      expect(context).toEqual({ page_type: 'product', id: '123' });
    });

    it('should read the context from the `data-option-context` attribute only', async () => {
      const context = await resolveContext(`
        <section data-component="TrackContext" data-option-context='{"page_type": "cart"}'>
        </section>
      `);

      expect(context).toEqual({ page_type: 'cart' });
    });

    it('should merge both sources, the attribute overriding the script ref', async () => {
      const context = await resolveContext(`
        <section
          data-component="TrackContext"
          data-option-context='{"page_type": "override", "from_attr": true}'>
          <script data-ref="context" type="application/json">{ "page_type": "script", "from_script": true }</script>
        </section>
      `);

      expect(context).toEqual({
        page_type: 'override',
        from_attr: true,
        from_script: true,
      });
    });
  });

  describe('ancestor chain', () => {
    it('should deep-merge every ancestor TrackContext, the nearest winning', async () => {
      // Emulate a PDP > Variant chain around the probe button.
      window.dataLayer = [];
      const { root } = await mountTree(`
        <div data-component="TrackContext" data-option-context='{"page_type": "product", "currency": "EUR", "product": {"id": "pdp", "brand": "ACME"}}'>
          <div data-component="TrackContext" data-option-context='{"product": {"id": "variant"}}'>
            <button data-component="Track" data-track:click='{"event": "probe"}'></button>
          </div>
        </div>
      `);

      (root.querySelector('button') as HTMLButtonElement).click();
      const payload = window.dataLayer.at(-1) as Record<string, unknown>;

      expect(payload).toEqual({
        page_type: 'product',
        currency: 'EUR',
        // Deep-merged: the inner context only overrides `product.id` while
        // `product.brand` is preserved from the outer context.
        product: { id: 'variant', brand: 'ACME' },
        event: 'probe',
      });
    });
  });

  describe('array merge (replace, not concat)', () => {
    it('should replace an ancestor array with the nearer context array', async () => {
      window.dataLayer = [];
      const { root } = await mountTree(`
        <div data-component="TrackContext" data-option-context='{"items": [{"id": "a"}, {"id": "b"}]}'>
          <div data-component="TrackContext" data-option-context='{"items": [{"id": "c"}]}'>
            <button data-component="Track" data-track:click='{"event": "probe"}'></button>
          </div>
        </div>
      `);

      (root.querySelector('button') as HTMLButtonElement).click();
      const payload = window.dataLayer.at(-1) as Record<string, unknown>;

      // Nearer context replaces the array instead of concatenating to 3 items.
      expect(payload.items).toEqual([{ id: 'c' }]);
    });

    it('should replace the script-ref array with the attribute array on the same context', async () => {
      const context = await resolveContext(`
        <section data-component="TrackContext" data-option-context='{"items": [{"id": "attr"}]}'>
          <script data-ref="context" type="application/json">{ "items": [{"id": "s1"}, {"id": "s2"}] }</script>
        </section>
      `);

      expect(context.items).toEqual([{ id: 'attr' }]);
    });
  });

  describe('malformed JSON tolerance', () => {
    it('should not throw and fall back to {} when the `context` ref is invalid JSON', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const context = await resolveContext(`
        <section data-component="TrackContext" data-option-log>
          <script data-ref="context" type="application/json">{ broken </script>
        </section>
      `);

      expect(context).toEqual({});
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should not throw and fall back to {} when `data-option-context` is invalid JSON', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const context = await resolveContext(`
        <section data-component="TrackContext" data-option-log data-option-context='{ not valid }'>
        </section>
      `);

      expect(context).toEqual({});
      spy.mockRestore();
    });
  });
});
