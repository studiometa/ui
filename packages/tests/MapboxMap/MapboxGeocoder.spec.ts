import { describe, it, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { recordEvents, settle, waitFor } from '@studiometa/js-toolkit/test';
import { MapboxGeocoder, MapboxMap } from '@studiometa/ui-mapbox';
import { mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxGeocoder);

/** The mocked `@mapbox/mapbox-gl-geocoder` control, with its test-only `fire`. */
interface MockGeocoderControl {
  addTo(target: unknown): void;
  onRemove(): void;
  /** Invoke the handlers the component registered through `on`. */
  fire(type: string, event: unknown): void;
}

/**
 * Mount a loaded `MapboxMap` holding one `MapboxGeocoder`.
 *
 * The component lazily `import()`s `@mapbox/mapbox-gl-geocoder` in `mounted()`,
 * so the control only exists once that dynamic import has settled — poll for it
 * rather than guessing how many turns it takes.
 */
async function createGeocoder(attrs = '') {
  const context = await mountMap(
    `<div data-component="MapboxGeocoder" data-option-options='{"accessToken":"geo-token"}' ${attrs}></div>`,
  );
  await context.load();
  const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxGeocoder"]')!;
  const instance = getInstance<MapboxGeocoder>(el, 'MapboxGeocoder')!;
  await waitFor(() => instance.control);

  return { context, instance, mockMap: context.mockMap };
}

describe('MapboxGeocoder component', () => {
  it('should mount and create a geocoder control', async () => {
    const { instance } = await createGeocoder();

    expect(instance.control).toBeDefined();
    expect(instance.control!.addTo).toBeDefined();
  });

  it('should call addTo on mount', async () => {
    const { instance } = await createGeocoder();

    expect(instance.control!.addTo).toHaveBeenCalled();
  });

  it('should add to element by default (addToMap=false)', async () => {
    const { instance } = await createGeocoder();

    expect(instance.target).toBe(instance.$el);
    expect(instance.control!.addTo).toHaveBeenCalledWith(instance.$el);
  });

  it('should add to map when addToMap is true', async () => {
    const { instance, mockMap } = await createGeocoder('data-option-add-to-map');

    expect(instance.target).toBe(mockMap);
    expect(instance.control!.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('should call onRemove on unmount when not added to map', async () => {
    const { instance, mockMap } = await createGeocoder();

    const control = instance.control!;
    instance.$unmount();
    await settle();

    expect(control.onRemove).toHaveBeenCalled();
    expect(mockMap.removeControl).not.toHaveBeenCalled();
  });

  it('should call removeControl on unmount when added to map', async () => {
    const { instance, mockMap } = await createGeocoder('data-option-add-to-map');

    const control = instance.control!;
    instance.$unmount();
    await settle();

    expect(mockMap.removeControl).toHaveBeenCalledWith(control);
    expect(control.onRemove).not.toHaveBeenCalled();
  });

  it('should not throw when unmounted before the control is created', async () => {
    const { instance, mockMap } = await createGeocoder();

    // v3 asserted this by calling `$destroy()` on a never-mounted instance; v4's
    // `$unmount()` returns early when the instance is not mounted, so nothing
    // would run at all. Clear the backing field instead: that is the state the
    // guard protects — the dynamic import never resolved, so no control exists
    // and teardown must be a no-op rather than throwing.
    (instance as unknown as { __control: unknown }).__control = undefined;

    expect(() => instance.$unmount()).not.toThrow();
    await settle();
    expect(mockMap.removeControl).not.toHaveBeenCalled();
  });

  it('should reuse the same control instance', async () => {
    const { instance } = await createGeocoder();

    expect(instance.control).toBe(instance.control);
  });

  it('should remove the previous element-targeted control when the map is replaced (H9)', async () => {
    const { context, instance } = await createGeocoder();
    const control1 = instance.control! as unknown as MockGeocoderControl;
    expect(control1.addTo).toHaveBeenCalledWith(instance.$el);

    // The map is removed and a replacement connects: the standing ready callback
    // re-runs. It must remove the previous element-attached control before
    // creating the new one, or each replacement stacks another geocoder on `$el`.
    context.mapbox.$unmount();
    await settle();
    context.mapbox.$mount();
    await settle();
    await context.load();

    expect(control1.onRemove).toHaveBeenCalledTimes(1);
    const control2 = instance.control! as unknown as MockGeocoderControl;
    expect(control2).not.toBe(control1);
    expect(control2.addTo).toHaveBeenCalledWith(instance.$el);
  });

  it('should re-emit the control `result` event as a component `map-result` event', async () => {
    const { instance } = await createGeocoder();
    const log = recordEvents(instance.$el, 'map-result');

    const payload = { center: [1, 2], bbox: [0, 0, 3, 3] };
    // The mocked control captures its `result` handlers; fire one as the real
    // control would when a suggestion is picked.
    (instance.control as unknown as MockGeocoderControl).fire('result', { result: payload });

    expect(log.events).toHaveLength(1);
    // v4 payloads are one named object: the geocoded result travels as
    // `detail.result`.
    expect((log.events[0].detail as { result: unknown }).result).toBe(payload);
    log.stop();
  });
});
