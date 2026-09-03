import { getInstance } from '@studiometa/js-toolkit';
import { mount, settle } from '@studiometa/js-toolkit/test';
// Loading the mock registers the `mapbox-gl` module mock and injects the mock
// namespace through `provideMapboxGl`, so a `MapboxMap` mounted here builds a
// `MockMap` instead of reaching for the real library. The re-export is what
// carries that side effect: `MockMap` is only used in type positions below, and
// a plain `import { MockMap }` would be elided by the TypeScript transform —
// dropping the injection with it and leaving `mapboxgl.Map` undefined.
export { MockMap } from './mock-mapbox-gl.js';
import type { MockMap } from './mock-mapbox-gl.js';
import { MapboxMap } from '@studiometa/ui-mapbox';

/** What {@link mountMap} hands back. */
export interface MountedMap {
  /** The wrapper element `mount()` appended to the document. */
  root: HTMLElement;
  /** The `MapboxMap` element, the ancestor every child resolves through. */
  mapEl: HTMLElement;
  /** The mounted `MapboxMap` component. */
  mapbox: MapboxMap;
  /** The `mapbox-gl` `Map` double the component built in `mounted()`. */
  mockMap: MockMap;
  /**
   * Fire the map's `load` event and let every child inject.
   *
   * Children park on `map-load`, so a test configures the `MockMap` — seeding a
   * sprite, deferring `loadImage`, stubbing `queryRenderedFeatures` — between
   * `mountMap()` and this call, and injection then runs against the map the
   * test set up.
   */
  load(): Promise<void>;
}

/**
 * Mount a `MapboxMap` wrapping the given markup, unloaded.
 *
 * A child resolves its real parent through the registry, so the markup below is
 * the whole setup: no `$closest` stub, and the map a child resolves is the one
 * the component built.
 *
 * The component's own `mounted()` resolves `mapbox-gl` asynchronously before
 * building the map, so the returned `mockMap` is only available once `mount()`
 * has settled — which it has by the time this resolves.
 *
 * @param children Markup appended inside the `MapboxMap` element.
 * @param attrs    Extra attributes for the `MapboxMap` element.
 */
export async function mountMap(children = '', attrs = ''): Promise<MountedMap> {
  const root = await mount(`
    <div data-component="MapboxMap" data-option-access-token="test-token" ${attrs}>
      <div data-ref="container"></div>
      ${children}
    </div>
  `);
  const mapEl = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
  const mapbox = getInstance<MapboxMap>(mapEl, 'MapboxMap')!;

  return {
    root,
    mapEl,
    mapbox,
    mockMap: mapDouble(mapbox),
    async load() {
      mapDouble(mapbox).fire('load');
      await settle();
    },
  };
}

/**
 * The `mapbox-gl` `Map` double a mounted `MapboxMap` built.
 *
 * The component's `map` getter is typed against the real `mapbox-gl`, so every
 * caller would otherwise repeat the same double cast to reach the mock's test
 * affordances (`fire`, `seedImage`, the spies).
 */
export function mapDouble(mapbox: MapboxMap): MockMap {
  return mapbox.map as unknown as MockMap;
}

/**
 * Append markup inside an already-mounted map and wait for it to mount.
 *
 * The registry mounts through a `MutationObserver`, so an appended child is not
 * up on the microtask that appended it — {@link settle} is what waits for the
 * observer callback and the work the child then queues.
 */
export async function append(parent: HTMLElement, html: string): Promise<HTMLElement> {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  const el = template.content.firstElementChild as HTMLElement;
  parent.append(el);
  await settle();
  return el;
}
