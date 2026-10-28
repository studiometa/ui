import { beforeEach, describe, expect, it } from 'vitest';
import { contexts, ready, resetFakeGsap, ScrollTrigger } from './fake-gsap.js';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, frames, mount, waitFor } from '@studiometa/js-toolkit/test';
import { GsapStep } from '@studiometa/ui-gsap/GsapStep';
import { GsapTimeline } from '@studiometa/ui-gsap/GsapTimeline';

registerComponents(GsapTimeline, GsapStep);

beforeEach(resetFakeGsap);

function step(attributes: string, content = '') {
  return `<div data-component="GsapStep" ${attributes}>${content}</div>`;
}

async function mountTimeline(attributes: string, content: string) {
  const root = await mount(`<div data-component="GsapTimeline" ${attributes}>${content}</div>`);
  const el = root.firstElementChild as HTMLElement;
  const instance = await waitFor(() => getInstance<GsapTimeline>(el, 'GsapTimeline'));
  return { root, el, instance };
}

/** The children of the timeline: start time, duration and targets. */
function children(instance: GsapTimeline) {
  const timeline = instance.animation as gsap.core.Timeline;
  return timeline.getChildren(false).map((child) => ({
    start: Number(child.startTime().toFixed(3)),
    duration: child.duration(),
    targets: (child as gsap.core.Tween).targets(),
  }));
}

/** Wait for the build number `count`, then for the frames a rebuild would take. */
async function builds(count: number) {
  await waitFor(() => contexts.length === count);
  await frames(3);
  expect(contexts).toHaveLength(count);
}

describe('The GsapTimeline component', () => {
  it('declares GsapStep as its child component', () => {
    expect(GsapTimeline.config.components).toHaveProperty('GsapStep', GsapStep);
  });

  it('composes its steps in DOM order', async () => {
    const { el, instance } = await mountTimeline(
      '',
      step(`data-option-to='{ "x": 10, "duration": 1 }'`) +
        step(`data-option-from='{ "y": 10, "duration": 0.5 }'`) +
        step(`data-option-from='{ "x": 0 }' data-option-to='{ "x": 5, "duration": 2 }'`),
    );
    await ready(instance);
    const steps = [...el.querySelectorAll('[data-component="GsapStep"]')];

    expect(children(instance)).toEqual([
      { start: 0, duration: 1, targets: [steps[0]] },
      { start: 1, duration: 0.5, targets: [steps[1]] },
      { start: 1.5, duration: 2, targets: [steps[2]] },
    ]);
    expect(instance.animation!.paused()).toBe(true);
    expect(instance.duration).toBe(3.5);
  });

  it('places the steps at number, relative and label positions', async () => {
    const { instance } = await mountTimeline(
      '',
      step(`data-option-at="0.5" data-option-to='{ "x": 10, "duration": 1 }'`) +
        step(`data-option-at="<" data-option-to='{ "y": 10, "duration": 1 }'`) +
        step(`data-option-at="-=0.25" data-option-to='{ "x": 5, "duration": 1 }'`) +
        step(`data-option-at="intro" data-option-to='{ "y": 5, "duration": 1 }'`) +
        step(`data-option-at="intro+=0.5" data-option-to='{ "x": 0, "duration": 1 }'`),
    );
    await ready(instance);
    const timeline = instance.animation as gsap.core.Timeline;

    expect(children(instance).map(({ start }) => start)).toEqual([0.5, 0.5, 1.25, 2.25, 2.75]);
    expect(timeline.labels).toEqual({ intro: 2.25 });
  });

  it('places the set variables of a step at its position', async () => {
    const { el, instance } = await mountTimeline(
      '',
      step(`data-option-to='{ "x": 10, "duration": 1 }'`) +
        step(`data-option-set='{ "opacity": 0.5 }' data-option-to='{ "x": 5, "duration": 1 }'`),
    );
    await ready(instance);
    const second = el.querySelectorAll<HTMLElement>('[data-component="GsapStep"]')[1];

    expect(children(instance).map(({ start, duration }) => [start, duration])).toEqual([
      [0, 1],
      [1, 0],
      [1, 1],
    ]);
    expect(second.style.opacity).toBe('');
    instance.animation!.progress(1);
    expect(second.style.opacity).toBe('0.5');
  });

  it('resolves the targets of a step inside the step', async () => {
    const { el, instance } = await mountTimeline(
      '',
      step(`data-option-targets="span" data-option-to='{ "x": 10 }'`, '<span></span><span></span>'),
    );
    await ready(instance);

    expect(children(instance)[0].targets).toEqual([...el.querySelectorAll('span')]);
  });

  it('applies the timeline variables', async () => {
    const diagnostics = captureDiagnostics();
    const { instance } = await mountTimeline(
      `data-option-timeline='{ "defaults": { "duration": 2 }, "repeat": 1, "paused": false }'`,
      step(`data-option-to='{ "x": 10 }'`),
    );
    await ready(instance);

    expect(instance.duration).toBe(2);
    expect((instance.animation as gsap.core.Timeline).totalDuration()).toBe(4);
    // `paused` is reserved: the component controls the playback.
    expect(instance.animation!.paused()).toBe(true);
    expect(diagnostics.codes).toEqual(['gsap.unsupported-vars']);
    diagnostics.stop();
  });

  it('builds nothing without steps, then builds when a step is added', async () => {
    const { el, instance } = await mountTimeline('', '');
    await frames(3);
    expect(instance.animation).toBeNull();

    el.insertAdjacentHTML('beforeend', step(`data-option-to='{ "x": 10 }'`));
    await ready(instance);
    expect(children(instance)).toHaveLength(1);
  });

  it('rebuilds once when steps are appended, removed or moved', async () => {
    const { el, instance } = await mountTimeline(
      '',
      step(`data-option-to='{ "x": 10, "duration": 1 }'`) +
        step(`data-option-to='{ "x": 20, "duration": 2 }'`),
    );
    await ready(instance);
    await builds(1);

    el.insertAdjacentHTML('beforeend', step(`data-option-to='{ "x": 30, "duration": 3 }'`));
    el.insertAdjacentHTML('beforeend', step(`data-option-to='{ "x": 40, "duration": 4 }'`));
    await builds(2);
    expect(children(instance).map(({ duration }) => duration)).toEqual([1, 2, 3, 4]);

    el.firstElementChild!.remove();
    await builds(3);
    expect(children(instance).map(({ duration }) => duration)).toEqual([2, 3, 4]);

    el.append(el.firstElementChild!);
    await builds(4);
    expect(children(instance).map(({ duration }) => duration)).toEqual([3, 4, 2]);
  });

  it('rebuilds once when the options of a step change', async () => {
    const { el, instance } = await mountTimeline(
      '',
      step(`data-option-to='{ "x": 10, "duration": 1 }'`),
    );
    await ready(instance);
    const first = el.firstElementChild!;

    first.setAttribute('data-option-to', '{ "x": 10, "duration": 3 }');
    first.setAttribute('data-option-at', '1');
    await builds(2);
    expect(children(instance)).toMatchObject([{ start: 1, duration: 3 }]);
  });

  it('owns its nearest steps only', async () => {
    const { el, instance } = await mountTimeline(
      '',
      step(`data-option-to='{ "x": 10, "duration": 1 }'`) +
        `<div data-component="GsapTimeline">${step(`data-option-to='{ "x": 20, "duration": 2 }'`)}</div>`,
    );
    const inner = getInstance<GsapTimeline>(
      el.querySelector('[data-component="GsapTimeline"]') as HTMLElement,
      'GsapTimeline',
    )!;
    await ready(instance);
    await ready(inner);

    expect(instance.steps).toHaveLength(1);
    expect(children(instance).map(({ duration }) => duration)).toEqual([1]);
    expect(children(inner).map(({ duration }) => duration)).toEqual([2]);
  });

  it('reports a step without a declaration and skips it', async () => {
    const diagnostics = captureDiagnostics();
    const { instance } = await mountTimeline(
      '',
      step('') + step(`data-option-to='{ "x": 10, "duration": 1 }'`),
    );
    await ready(instance);

    expect(diagnostics.codes).toContain('gsap.empty-declaration');
    expect(
      diagnostics.entries.find(({ code }) => code === 'gsap.empty-declaration')?.component,
    ).toBe('GsapStep');
    expect(children(instance)).toHaveLength(1);
    diagnostics.stop();
  });

  it('creates a ScrollTrigger for the timeline', async () => {
    const { el, instance } = await mountTimeline(
      `data-option-scroll-trigger='{ "scrub": 1 }'`,
      step(`data-option-to='{ "x": 10 }'`),
    );
    await ready(instance);

    expect(instance.animation!.scrollTrigger).toBeInstanceOf(ScrollTrigger);
    expect(instance.animation!.scrollTrigger!.trigger).toBe(el);
  });

  it('commits nothing when it unmounts before the DOM settles', async () => {
    const { instance } = await mountTimeline('', step(`data-option-to='{ "x": 10 }'`));
    await ready(instance);
    resetFakeGsap();

    instance.rebuild();
    await frames(1);
    instance.$unmount();
    await frames(3);

    expect(contexts.filter(({ revert }) => revert.mock.calls.length === 0)).toHaveLength(0);
  });
});
