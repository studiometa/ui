import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activeContexts, contexts, ready, resetFakeGsap } from './fake-gsap.js';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import {
  captureDiagnostics,
  frames,
  mount,
  recordEvents,
  settle,
  waitFor,
} from '@studiometa/js-toolkit/test';
import { Gsap } from '@studiometa/ui-gsap/Gsap';

/**
 * A controllable `(prefers-reduced-motion: reduce)` service.
 */
const reducedMotion = vi.hoisted(() => {
  const subscribers = new Set<(props: { matches: boolean }) => void>();
  const props = { matches: false };
  return {
    props,
    subscribers,
    set(matches: boolean) {
      props.matches = matches;
      for (const subscriber of subscribers) {
        subscriber(props);
      }
    },
  };
});

vi.mock('@studiometa/js-toolkit/usePrefersReducedMotion', () => {
  const service = {
    props: () => reducedMotion.props,
    subscribe(callback: (props: { matches: boolean }) => void) {
      reducedMotion.subscribers.add(callback);
      return () => reducedMotion.subscribers.delete(callback);
    },
  };
  return { usePrefersReducedMotion: () => service, default: () => service };
});

/**
 * A subclass that is not registered: the specs mount it by hand, so they can
 * act before the asynchronous resolution of GSAP ends.
 */
class ManualGsap extends Gsap {
  static config = { name: 'ManualGsap' };
}

registerComponents(Gsap);

beforeEach(() => {
  resetFakeGsap();
  reducedMotion.set(false);
});

afterEach(() => {
  reducedMotion.set(false);
});

function manual(attributes: Record<string, string>) {
  const el = document.createElement('div');
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value);
  }
  document.body.append(el);
  const instance = new ManualGsap(el);
  return { el, instance };
}

async function mountGsap(attributes: string) {
  const root = await mount(`<div data-component="Gsap" ${attributes}></div>`);
  const el = root.firstElementChild as HTMLElement;
  const instance = await waitFor(() => getInstance<Gsap>(el, 'Gsap'));
  await ready(instance);
  return { root, el, instance };
}

describe('The Gsap lifecycle', () => {
  it('keeps the playback commands issued before GSAP is ready', async () => {
    const { instance } = manual({ 'data-option-to': '{ "x": 10, "duration": 1 }' });
    instance.$mount();

    expect(instance.animation).toBeNull();
    instance.seek(0.5);
    instance.play();

    await ready(instance);
    const animation = instance.animation!;
    expect(animation.paused()).toBe(false);
    expect(animation.time()).toBeGreaterThanOrEqual(0.5);
    instance.$unmount();
  });

  it('commits nothing when it unmounts before GSAP is ready', async () => {
    const { instance } = manual({ 'data-option-to': '{ "x": 10 }' });
    instance.$mount();
    instance.$unmount();
    await frames(2);

    expect(instance.animation).toBeNull();
    expect(contexts).toHaveLength(0);
  });

  it('commits nothing when it unmounts before the ScrollTrigger plugin is ready', async () => {
    const { instance } = manual({
      'data-option-to': '{ "x": 10 }',
      'data-option-scroll-trigger': '',
    });
    instance.$mount();
    instance.$unmount();
    await frames(2);

    expect(instance.animation).toBeNull();
    expect(contexts).toHaveLength(0);
  });

  it('commits only the newest of overlapping builds', async () => {
    const { instance } = manual({ 'data-option-to': '{ "x": 10 }' });
    instance.$mount();
    instance.__build();
    instance.__build();
    await ready(instance);
    await frames(2);

    expect(contexts).toHaveLength(1);
    instance.$unmount();
  });

  it('reverts each context once, on rebuild and on unmount', async () => {
    const { instance } = await mountGsap(`data-option-to='{ "x": 10 }'`);

    instance.rebuild();
    await waitFor(() => contexts.length === 2);
    expect(contexts[0].revert).toHaveBeenCalledTimes(1);
    expect(contexts[1].revert).not.toHaveBeenCalled();

    instance.$unmount();
    expect(contexts[0].revert).toHaveBeenCalledTimes(1);
    expect(contexts[1].revert).toHaveBeenCalledTimes(1);
    expect(instance.animation).toBeNull();
  });

  it('restores the authored DOM state on unmount', async () => {
    const { el, instance } = await mountGsap(`data-option-from='{ "opacity": 0 }'`);
    expect(el.style.opacity).toBe('0');

    instance.$unmount();
    expect(el.style.opacity).toBe('');
  });

  it('builds again from a clean state when it mounts again', async () => {
    const { instance } = await mountGsap(`data-option-to='{ "x": 10, "duration": 1 }'`);
    instance.seek(0.5);

    instance.$unmount();
    instance.$mount();
    await ready(instance);

    expect(contexts).toHaveLength(2);
    expect(activeContexts()).toHaveLength(1);
    expect(instance.animation!.progress()).toBe(0);
    expect(instance.animation!.paused()).toBe(true);
  });

  it('coalesces rebuild calls of the same frame', async () => {
    const { instance } = await mountGsap(`data-option-to='{ "x": 10 }'`);

    instance.rebuild();
    instance.rebuild();
    instance.rebuild();
    await waitFor(() => contexts.length === 2);
    await frames(3);

    expect(contexts).toHaveLength(2);
  });

  it.each([
    ['targets', 'data-option-targets', ''],
    ['set', 'data-option-set', '{ "opacity": 0.5 }'],
    ['from', 'data-option-from', '{ "y": 5 }'],
    ['to', 'data-option-to', '{ "x": 20 }'],
    ['scrollTrigger', 'data-option-scroll-trigger', ''],
  ])('rebuilds once when the %s option changes', async (_name, attribute, value) => {
    const { el } = await mountGsap(`data-option-to='{ "x": 10 }'`);

    el.setAttribute(attribute, value);
    await waitFor(() => contexts.length === 2);
    await frames(3);

    expect(contexts).toHaveLength(2);
  });

  it('rebuilds once for several option changes in the same frame', async () => {
    const { el } = await mountGsap(`data-option-to='{ "x": 10 }'`);

    el.setAttribute('data-option-to', '{ "x": 30 }');
    el.setAttribute('data-option-from', '{ "x": 5 }');
    el.setAttribute('data-option-set', '{ "opacity": 0.5 }');
    await waitFor(() => contexts.length === 2);
    await frames(3);

    expect(contexts).toHaveLength(2);
  });

  it('plays when autoplay is turned on after the mount', async () => {
    const { el, instance } = await mountGsap(`data-option-to='{ "x": 10, "duration": 1 }'`);

    el.setAttribute('data-option-autoplay', '');
    await waitFor(() => !instance.animation!.paused());
    expect(contexts).toHaveLength(1);
  });

  it('keeps the progress and the playback state through a rebuild', async () => {
    const { el, instance } = await mountGsap(`data-option-to='{ "x": 10, "duration": 1 }'`);
    instance.seek(0.5);

    el.setAttribute('data-option-to', '{ "x": 20, "duration": 1 }');
    await waitFor(() => contexts.length === 2 && instance.animation !== null);

    expect(instance.animation!.time()).toBe(0.5);
    expect(instance.animation!.paused()).toBe(true);

    instance.play();
    el.setAttribute('data-option-to', '{ "x": 30, "duration": 1 }');
    await waitFor(() => contexts.length === 3 && instance.animation !== null);

    expect(instance.animation!.paused()).toBe(false);
    expect(instance.animation!.time()).toBeGreaterThanOrEqual(0.5);
  });

  it('does not play or complete a finished animation again after a rebuild', async () => {
    const { root, instance } = await mountGsap(`data-option-to='{ "x": 10, "duration": 1 }'`);
    instance.play();
    instance.complete();
    const log = recordEvents(root, 'gsap-play', 'gsap-complete');

    instance.rebuild();
    await waitFor(() => contexts.length === 2 && instance.animation !== null);
    await frames(2);

    expect(instance.animation!.progress()).toBe(1);
    expect(log.events).toEqual([]);
    log.stop();
  });

  it('lets a new ScrollTrigger read its progress from the scroll position', async () => {
    const { instance } = await mountGsap(
      `data-option-scroll-trigger='{ "scrub": true, "start": "top bottom", "end": "+=100000" }' data-option-to='{ "x": 10 }'`,
    );
    instance.animation!.progress(0.5);

    instance.rebuild();
    await waitFor(() => contexts.length === 2 && instance.animation !== null);

    expect(instance.animation!.progress()).toBeLessThan(0.5);
  });

  it('ignores the callbacks of a replaced animation', async () => {
    const { root, instance } = await mountGsap(`data-option-to='{ "x": 10 }'`);
    const previous = instance.animation!;
    const log = recordEvents(root, 'gsap-complete', 'gsap-reverse-complete', 'gsap-interrupt');

    instance.rebuild();
    await waitFor(() => contexts.length === 2 && instance.animation !== null);
    previous.eventCallback('onComplete')?.();
    previous.eventCallback('onReverseComplete')?.();
    previous.eventCallback('onInterrupt')?.();

    expect(log.events).toEqual([]);
    log.stop();
  });

  it('reports a failed build and keeps no context', async () => {
    const diagnostics = captureDiagnostics();
    const { instance } = manual({ 'data-option-to': '{ "x": 10 }' });
    vi.spyOn(instance, '__create').mockImplementation(() => {
      throw new Error('broken');
    });
    instance.$mount();

    await waitFor(() => diagnostics.codes.includes('gsap.build-failed'));
    expect(instance.animation).toBeNull();
    expect(activeContexts()).toHaveLength(0);
    instance.$unmount();
    diagnostics.stop();
  });
});

describe('The Gsap lifecycle with reduced motion', () => {
  it('builds nothing and keeps the authored DOM state', async () => {
    reducedMotion.set(true);
    const root = await mount(
      `<div data-component="Gsap" data-option-autoplay data-option-from='{ "opacity": 0 }'></div>`,
    );
    const el = root.firstElementChild as HTMLElement;
    const instance = await waitFor(() => getInstance<Gsap>(el, 'Gsap'));
    await frames(3);

    expect(instance.animation).toBeNull();
    expect(contexts).toHaveLength(0);
    expect(el.style.opacity).toBe('');
  });

  it('reverts when the preference changes to reduce, and builds again when it ends', async () => {
    const { el, instance } = await mountGsap(`data-option-from='{ "opacity": 0, "duration": 1 }'`);
    instance.seek(0.5);
    expect(el.style.opacity).not.toBe('');

    reducedMotion.set(true);
    expect(instance.animation).toBeNull();
    expect(contexts[0].revert).toHaveBeenCalledTimes(1);
    expect(el.style.opacity).toBe('');

    instance.play();
    await settle();
    expect(contexts).toHaveLength(1);

    reducedMotion.set(false);
    await ready(instance);
    expect(contexts).toHaveLength(2);
    expect(instance.animation!.time()).toBeGreaterThanOrEqual(0.5);
    expect(instance.animation!.paused()).toBe(false);
  });
});
