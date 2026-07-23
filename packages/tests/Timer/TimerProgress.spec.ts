import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Timer, TimerProgress } from '@studiometa/ui';
import { h, useFakeTimers, useRealTimers, advanceTimersByTimeAsync } from '#test-utils';

function listen(el: HTMLElement, ...names: string[]) {
  const calls: Record<string, number> = {};
  const details: Record<string, unknown[][]> = {};

  for (const name of names) {
    calls[name] = 0;
    details[name] = [];
    el.addEventListener(name, (event) => {
      calls[name] += 1;
      details[name].push((event as CustomEvent).detail);
    });
  }

  return { calls, details };
}

async function mountTimerProgress(
  attributes: Record<string, string> = {},
  events: string[] = [],
) {
  const el = h('div', { dataComponent: 'TimerProgress', ...attributes });
  const recorder = listen(el, ...events);
  const instance = new TimerProgress(el);
  instance.$mount();
  await advanceTimersByTimeAsync(50);

  return { el, instance, ...recorder };
}

/** Flatten recorded single-argument `detail` arrays into their ratio values. */
function ratios(details: unknown[][]): number[] {
  return details.map((detail) => (detail as number[])[0]);
}

describe('TimerProgress component', () => {
  beforeEach(() => {
    useFakeTimers();
  });

  afterEach(() => {
    useRealTimers();
  });

  it('should have the correct config and extend Timer', () => {
    expect(TimerProgress.config.name).toBe('TimerProgress');
    expect(TimerProgress.config.emits).toEqual(['timer-progress']);
    expect(TimerProgress.prototype).toBeInstanceOf(Timer);
  });

  it('should merge the parent lifecycle events into its config', async () => {
    const { instance } = await mountTimerProgress({ dataOptionDelay: '1' });
    expect(instance.$config.emits).toContain('timer-start');
    expect(instance.$config.emits).toContain('timer-end');
    expect(instance.$config.emits).toContain('timer-progress');
  });

  it('should emit an increasing progress ratio during the countdown', async () => {
    const { details } = await mountTimerProgress({ dataOptionDelay: '2' }, ['timer-progress']);
    await advanceTimersByTimeAsync(1000);

    const values = ratios(details['timer-progress']);
    expect(values.length).toBeGreaterThan(1);
    // Values stay within bounds and progress forward.
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(values.at(-1)).toBeGreaterThan(values[0]);
    expect(values.at(-1)).toBeLessThanOrEqual(1);
  });

  it('should report a final ratio of 1 when the countdown completes', async () => {
    const { details, calls } = await mountTimerProgress({ dataOptionDelay: '1' }, [
      'timer-progress',
      'timer-end',
    ]);
    await advanceTimersByTimeAsync(1100);

    expect(calls['timer-end']).toBe(1);
    expect(ratios(details['timer-progress'])).toContain(1);
  });

  it('should reset progress to 0 on stop', async () => {
    const { instance, details } = await mountTimerProgress({ dataOptionDelay: '2' }, [
      'timer-progress',
    ]);
    await advanceTimersByTimeAsync(500);
    instance.stop();

    expect(ratios(details['timer-progress']).at(-1)).toBe(0);
  });

  it('should stop the progress loop when a listener stops it mid-dispatch', async () => {
    const el = h('div', { dataComponent: 'TimerProgress', dataOptionDelay: '5' });
    const instance = new TimerProgress(el);
    let count = 0;
    // A listener that tears the timer down synchronously on the first frame.
    el.addEventListener('timer-progress', () => {
      count += 1;
      if (count === 1) {
        instance.stop();
      }
    });
    instance.$mount();

    await advanceTimersByTimeAsync(2000);

    // Without the guard the loop would resurrect itself and keep counting up;
    // `stop()` also emits a final progress of 0, so at most two events fire.
    expect(count).toBeLessThanOrEqual(2);
  });

  it('should still emit the base lifecycle events', async () => {
    const { calls } = await mountTimerProgress({ dataOptionDelay: '1' }, [
      'timer-start',
      'timer-end',
    ]);
    expect(calls['timer-start']).toBe(1);
    await advanceTimersByTimeAsync(1100);
    expect(calls['timer-end']).toBe(1);
  });
});
