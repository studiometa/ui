import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';

/**
 * The geocoder module is loaded lazily via a dynamic `import()` inside
 * `MapboxGeocoder.mounted()`. To reproduce the mount/teardown race we gate that
 * import behind a controllable promise so the component can be destroyed while
 * the import is still pending.
 *
 * This spec deliberately declares its own gated mock instead of reusing the
 * synchronous mock from `mock-mapbox-gl.ts` (mocks are file-scoped, so the other
 * geocoder specs keep their instant import).
 */
const gate = vi.hoisted(() => {
  let release!: () => void;
  function make() {
    return new Promise<void>((resolve) => (release = resolve));
  }
  return {
    promise: make(),
    open() {
      release();
    },
    reset() {
      this.promise = make();
    },
  };
});

vi.mock('mapbox-gl', () => ({
  default: {
    Map: class {
      on = vi.fn();
      remove = vi.fn();
    },
  },
}));

vi.mock('@mapbox/mapbox-gl-geocoder', async () => {
  await gate.promise;
  class MockGeocoder {
    addTo = vi.fn();
    onRemove = vi.fn();
  }
  return { default: MockGeocoder };
});

const { MapboxGeocoder } = await import('@studiometa/ui-mapbox');

function createGeocoder() {
  const mockMap = { removeControl: vi.fn() };
  const el = h('div', {
    'data-component': 'MapboxGeocoder',
    'data-option-options': '{"accessToken":"geo-token"}',
  });
  const instance = new MapboxGeocoder(el);
  // Mock $closest since async component resolution doesn't set it up.
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, $options: { accessToken: 'parent-token' } } as any;
    }
    return undefined;
  });
  return { instance, mockMap };
}

// Real timers: the gated dynamic import does not settle cleanly under fake
// timers, so drive the async work with a short real delay instead.
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

describe('MapboxGeocoder teardown race', () => {
  it('should not create or add the control when destroyed before the import resolves', async () => {
    gate.reset();
    const { instance, mockMap } = createGeocoder();

    instance.$mount();
    await tick();

    // The dynamic import is still pending: no control has been created yet.
    expect(instance.control).toBeUndefined();

    // Destroy while the import is in flight, then let it resolve afterwards.
    instance.$destroy();
    await tick();
    gate.open();
    await tick();

    // The control must never be created nor added to the map after teardown.
    expect(instance.control).toBeUndefined();
    expect(mockMap.removeControl).not.toHaveBeenCalled();
  });

  it('should create and add the control on a normal mount', async () => {
    gate.reset();
    const { instance } = createGeocoder();

    instance.$mount();
    gate.open();
    await tick();

    expect(instance.control).toBeDefined();
    expect(instance.control.addTo).toHaveBeenCalledWith(instance.$el);
  });
});
