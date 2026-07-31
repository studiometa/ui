import { describe, it, expect, vi } from 'vitest';
// Importing the mock first registers the `mapbox-gl` module mock before the
// package (and its real `mapbox-gl` dependency) is imported below.
import './mock-mapbox-gl.js';
import { h } from '#test-utils';
import { StoreLocatorItem } from '@studiometa/ui-mapbox';

/**
 * A minimal coordinator stand-in exposing only the surface the item touches.
 */
function fakeCoordinator() {
  return {
    registerItem: vi.fn(),
    unregisterItem: vi.fn(),
    selectItem: vi.fn(),
  };
}

describe('StoreLocatorItem component', () => {
  it('registers with the coordinator on mount', () => {
    const el = h('li', {
      'data-component': 'StoreLocatorItem',
      'data-option-id': 'a',
      'data-option-lng-lat': '[1,2]',
    }) as HTMLElement;
    const item = new StoreLocatorItem(el);
    const coordinator = fakeCoordinator();
    Object.defineProperty(item, 'storeLocator', { get: () => coordinator, configurable: true });

    item.mounted();

    expect(coordinator.registerItem).toHaveBeenCalledWith(item);
  });

  it('unregisters on destroy even after the element has been detached', () => {
    const el = h('li', {
      'data-component': 'StoreLocatorItem',
      'data-option-id': 'a',
      'data-option-lng-lat': '[1,2]',
    }) as HTMLElement;
    const item = new StoreLocatorItem(el);
    const coordinator = fakeCoordinator();

    // The coordinator resolves via `$closest` while the item is connected…
    let resolved: ReturnType<typeof fakeCoordinator> | undefined = coordinator;
    Object.defineProperty(item, 'storeLocator', { get: () => resolved, configurable: true });

    item.mounted();
    expect(coordinator.registerItem).toHaveBeenCalledWith(item);

    // …but a `Fetch`/facet swap detaches the node first, so `$closest` (and thus
    // the getter) would now return nothing. The cached reference must keep the
    // unregister path working.
    resolved = undefined;

    item.destroyed();

    expect(coordinator.unregisterItem).toHaveBeenCalledWith(item);
  });
});
