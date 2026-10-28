import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { activeContexts, gsap, ready, resetFakeGsap, ScrollTrigger } from './fake-gsap.js';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, mount, recordEvents, waitFor } from '@studiometa/js-toolkit/test';
import { Gsap } from '@studiometa/ui-gsap/Gsap';

registerComponents(Gsap);

beforeEach(resetFakeGsap);

afterEach(() => {
  window.scrollTo(0, 0);
});

async function mountGsap(attributes: string, content = '') {
  const root = await mount(`<div data-component="Gsap" ${attributes}>${content}</div>`);
  const el = root.querySelector<HTMLElement>('[data-component="Gsap"]')!;
  const instance = await waitFor(() => getInstance<Gsap>(el, 'Gsap'));
  return { root, el, instance };
}

describe('The Gsap component', () => {
  it('builds a paused to() tween on the root', async () => {
    const { el, instance } = await mountGsap(`data-option-to='{ "x": 100, "duration": 1 }'`);
    await ready(instance);
    const animation = instance.animation!;

    expect(animation.paused()).toBe(true);
    expect(animation.progress()).toBe(0);
    expect(instance.duration).toBe(1);
    expect((animation as gsap.core.Tween).targets()).toEqual([el]);

    animation.progress(1);
    expect(el.style.transform).toContain('translate(100px');
  });

  it('builds a from() tween that applies the starting state', async () => {
    const { el, instance } = await mountGsap(`data-option-from='{ "opacity": 0 }'`);
    await ready(instance);

    expect(el.style.opacity).toBe('0');
  });

  it('builds a fromTo() tween when from and to are given', async () => {
    const { el, instance } = await mountGsap(
      `data-option-from='{ "opacity": 0.2 }' data-option-to='{ "opacity": 0.8 }'`,
    );
    await ready(instance);
    const animation = instance.animation!;

    expect(el.style.opacity).toBe('0.2');
    animation.progress(1);
    expect(el.style.opacity).toBe('0.8');
  });

  it('applies set before the tween', async () => {
    const { el, instance } = await mountGsap(
      `data-option-set='{ "opacity": 0.5, "x": 10 }' data-option-to='{ "x": 50 }'`,
    );
    await ready(instance);
    const animation = instance.animation!;

    expect(el.style.opacity).toBe('0.5');
    expect(el.style.transform).toContain('translate(10px');
    animation.progress(1);
    expect(el.style.transform).toContain('translate(50px');
  });

  it('applies set alone without an animation', async () => {
    const { el, instance } = await mountGsap(`data-option-set='{ "opacity": 0.5 }'`);
    await waitFor(() => el.style.opacity === '0.5');

    expect(instance.animation).toBeNull();
    expect(instance.progress).toBe(0);
    expect(instance.duration).toBe(0);
  });

  it('resolves targets inside the root only', async () => {
    const outside = document.createElement('span');
    outside.className = 'item';
    document.body.append(outside);

    const { el, instance } = await mountGsap(
      `data-option-targets=".item" data-option-to='{ "x": 10 }'`,
      '<span class="item"></span><span class="item"></span>',
    );
    await ready(instance);
    const animation = instance.animation as gsap.core.Tween;

    expect(animation.targets()).toEqual([...el.querySelectorAll('.item')]);
    expect(animation.targets()).not.toContain(outside);
    outside.remove();
  });

  it.each([
    ['an invalid selector', '[['],
    ['a selector without a match', '.missing'],
  ])('reports %s', async (_label, selector) => {
    const diagnostics = captureDiagnostics();
    const { instance } = await mountGsap(
      `data-option-targets="${selector}" data-option-to='{ "x": 10 }'`,
    );

    await waitFor(() => diagnostics.codes.includes('gsap.invalid-targets'));
    expect(instance.animation).toBeNull();
    expect(activeContexts()).toHaveLength(1);
    diagnostics.stop();
  });

  it('reports an empty declaration', async () => {
    const diagnostics = captureDiagnostics();
    const { instance } = await mountGsap('');

    await waitFor(() => diagnostics.codes.includes('gsap.empty-declaration'));
    expect(instance.animation).toBeNull();
    diagnostics.stop();
  });

  it('removes the reserved keys and reports them', async () => {
    const diagnostics = captureDiagnostics();
    const { instance } = await mountGsap(
      `data-option-to='{ "x": 10, "paused": false, "onComplete": "nope", "scrollTrigger": true, "callbackScope": {} }'`,
    );
    await ready(instance);
    const animation = instance.animation!;

    expect(diagnostics.codes).toContain('gsap.unsupported-vars');
    expect(animation.paused()).toBe(true);
    expect(animation.scrollTrigger).toBeUndefined();
    expect(animation.vars.onComplete).not.toBe('nope');
    diagnostics.stop();
  });

  it('plays on mount with autoplay', async () => {
    const log = recordEvents(document, 'gsap-ready', 'gsap-play', 'gsap-complete');
    const { instance } = await mountGsap(
      `data-option-autoplay data-option-to='{ "x": 10, "duration": 0.1 }'`,
    );

    await waitFor(() => log.events.some(({ type }) => type === 'gsap-complete'));
    expect(log.events.map(({ type }) => type)).toEqual([
      'gsap-ready',
      'gsap-play',
      'gsap-complete',
    ]);
    expect(instance.progress).toBe(1);
    log.stop();
  });

  it('drives the playback with its methods and emits the gsap- events', async () => {
    const { root, instance } = await mountGsap(`data-option-to='{ "x": 10, "duration": 1 }'`);
    await ready(instance);
    const animation = instance.animation!;
    const log = recordEvents(
      root,
      'gsap-play',
      'gsap-pause',
      'gsap-complete',
      'gsap-reverse-complete',
      'gsap-interrupt',
    );

    instance.play();
    expect(animation.paused()).toBe(false);
    instance.pause();
    expect(animation.paused()).toBe(true);
    instance.seek(0.25);
    expect(animation.time()).toBe(0.25);
    instance.complete();
    expect(instance.progress).toBe(1);
    instance.reverse();
    expect(animation.reversed()).toBe(true);
    animation.progress(0);
    instance.restart();
    expect(animation.reversed()).toBe(false);
    expect(animation.paused()).toBe(false);

    expect(log.events.map(({ type }) => type)).toEqual([
      'gsap-play',
      'gsap-pause',
      'gsap-complete',
      'gsap-play',
      'gsap-reverse-complete',
      'gsap-play',
    ]);
    expect(log.events[0].detail).toEqual({ animation, progress: 0 });
    log.stop();
  });

  it('emits gsap-interrupt when GSAP kills the animation', async () => {
    const { root, el, instance } = await mountGsap(`data-option-to='{ "x": 10, "duration": 1 }'`);
    const log = recordEvents(root, 'gsap-interrupt');
    await ready(instance);

    instance.play();
    await waitFor(() => instance.progress > 0);
    gsap.killTweensOf(el);

    expect(log.events.map(({ type }) => type)).toEqual(['gsap-interrupt']);
    log.stop();
  });

  it('creates a ScrollTrigger on the root with a bare scrollTrigger option', async () => {
    const { el, instance } = await mountGsap(
      `data-option-scroll-trigger data-option-to='{ "x": 10 }'`,
    );
    await ready(instance);
    const animation = instance.animation!;

    expect(animation.scrollTrigger).toBeInstanceOf(ScrollTrigger);
    expect(animation.scrollTrigger!.trigger).toBe(el);
  });

  it('resolves the scrollTrigger elements inside the root', async () => {
    const { el, instance } = await mountGsap(
      `data-option-scroll-trigger='{ "trigger": ".trigger", "scrub": true }' data-option-to='{ "x": 10 }'`,
      '<div class="trigger"></div>',
    );
    await ready(instance);
    const animation = instance.animation!;

    expect(animation.scrollTrigger!.trigger).toBe(el.querySelector('.trigger'));
  });
});
