import { describe, it, expect, vi } from 'vitest';
import type { BaseConfig } from '@studiometa/js-toolkit';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, recordEvents, settle } from '@studiometa/js-toolkit/test';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
  MapboxMap,
  MapboxMarker,
} from '@studiometa/ui-mapbox';
import { append, mountMap } from './harness.js';

interface AsyncChildProps extends AbstractMapboxMapChildProps {
  /**
   * `done` joins the inherited `map-error`. Both are declared in the props
   * type, and each payload is one named object.
   */
  $emits: AbstractMapboxMapChildProps['$emits'] & {
    done: { map: unknown };
  };
}

/**
 * A concrete child whose async ready callback can be made to reject or to gate on
 * an external promise, used to exercise the async containment and stale-callback
 * invalidation centralised in `AbstractMapboxMapChild`.
 */
class AsyncChild extends AbstractMapboxMapChild<AsyncChildProps> {
  static config: BaseConfig = {
    name: 'AsyncChild',
  };

  rejectWith?: Error;
  gate: Promise<void> = Promise.resolve();
  ran = 0;
  skipped = 0;

  mounted() {
    this.whenMapReady(async (map) => {
      await this.gate;

      // The map may have been removed/replaced (or the child unmounted) while
      // the callback was awaiting: honour the same identity guard the built-in
      // subclasses use so a stale callback no-ops instead of mutating a dead map.
      if (!this.$isMounted || this.__readyMap !== map) {
        this.skipped += 1;
        return;
      }

      this.ran += 1;

      if (this.rejectWith) {
        throw this.rejectWith;
      }

      this.$emit('done', { map });
    });
  }
}

registerComponents(MapboxMap, MapboxMarker, AsyncChild);

const ASYNC_HTML = '<div data-component="AsyncChild"></div>';
const MARKER_HTML = '<div data-component="MapboxMarker" data-option-lng-lat="[2, 48]"></div>';

/** Mount a loaded `MapboxMap` holding one `AsyncChild`, not yet armed. */
async function createAsyncChild() {
  const context = await mountMap();
  await context.load();
  const el = await append(context.mapEl, ASYNC_HTML);

  return {
    context,
    instance: getInstance<AsyncChild>(el, 'AsyncChild')!,
    mockMap: context.mockMap,
  };
}

describe('AbstractMapboxMapChild — async ready callbacks (F-async)', () => {
  it('should contain a rejected async callback: no unhandled rejection, reports + emits map-error', async () => {
    const { instance } = await createAsyncChild();
    // A recovered failure is reported on the diagnostic channel, so the
    // assertion reads the namespaced code.
    const diagnostics = captureDiagnostics();
    const log = recordEvents(instance.$el, 'map-error');
    const boom = new Error('async boom');

    // A global unhandled rejection would fail the run, so assert none fires.
    const onUnhandled = vi.fn();
    window.addEventListener('unhandledrejection', onUnhandled);

    instance.$unmount();
    instance.ran = 0;
    instance.rejectWith = boom;
    instance.$mount();
    await settle();

    window.removeEventListener('unhandledrejection', onUnhandled);

    expect(instance.ran).toBe(1);
    expect(diagnostics.codes).toContain('mapbox-map-child.failed');
    expect(log.events).toHaveLength(1);
    // The payload is one named object: the cause travels as `detail.error`.
    expect((log.events[0].detail as { error: unknown }).error).toBe(boom);
    expect(onUnhandled).not.toHaveBeenCalled();

    log.stop();
    diagnostics.stop();
  });

  it('should run a resolving async callback to completion', async () => {
    const { instance } = await createAsyncChild();
    const log = recordEvents(instance.$el, 'done');

    instance.$unmount();
    instance.ran = 0;
    instance.$mount();
    await settle();

    expect(instance.ran).toBe(1);
    expect(log.events).toHaveLength(1);
    log.stop();
  });

  it('should no-op a stale async callback whose map was removed mid-flight', async () => {
    const { instance, mockMap } = await createAsyncChild();
    const log = recordEvents(instance.$el, 'done');

    // Gate the callback so we can remove the map while it is awaiting.
    let openGate: (() => void) | undefined;
    instance.$unmount();
    instance.ran = 0;
    instance.skipped = 0;
    instance.gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    instance.$mount();
    await settle();

    // The map is removed while the callback is still awaiting the gate: the base
    // clears `__readyMap`, invalidating the in-flight callback.
    mockMap.remove();
    expect(instance.__readyMap).toBeUndefined();

    openGate!();
    await settle();

    // The stale callback bailed instead of mutating the dead map or emitting.
    expect(instance.skipped).toBe(1);
    expect(instance.ran).toBe(0);
    expect(log.events).toHaveLength(0);
    log.stop();
  });
});

describe('AbstractMapboxMapChild — removal before initial load (H2)', () => {
  it('should re-inject on a replacement map after the first was removed before it loaded', async () => {
    // First map: built but NOT loaded yet — the child binds and waits on
    // `map-load`.
    const context = await mountMap(MARKER_HTML);
    const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxMarker"]')!;
    const instance = getInstance<MapboxMarker>(el, 'MapboxMarker')!;
    const marker = instance.marker as unknown as { addTo: unknown };

    // Not injected: the map never loaded.
    expect(marker.addTo).not.toHaveBeenCalled();

    // The map is removed BEFORE it ever loaded. Because the child bound the
    // `remove` handler at bind-time (not only after load), it drops the pending
    // `map-load` subscription and re-parks on the connected event.
    context.mapbox.$unmount();
    await settle();
    expect(instance.__readyMap).toBeUndefined();

    // A replacement map connects and loads: the still-mounted child re-injects.
    context.mapbox.$mount();
    await settle();
    await context.load();

    expect(marker.addTo).toHaveBeenCalledWith(context.mapbox.map);
  });
});
