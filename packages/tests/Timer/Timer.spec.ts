import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Timer } from '@studiometa/ui';
import { h, useFakeTimers, useRealTimers, advanceTimersByTimeAsync } from '#test-utils';

/**
 * Record how many times each named event fires on the element, keeping the
 * `detail` payloads so bubbling `CustomEvent`s can be asserted like an `Action`
 * would consume them.
 */
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

/**
 * Build a `Timer` element, attach listeners, then mount and flush the mount
 * queue so `mounted()` (and its `autostart`) has run.
 */
async function mountTimer(attributes: Record<string, string> = {}, events: string[] = []) {
  const el = h('div', { dataComponent: 'Timer', ...attributes });
  const recorder = listen(el, ...events);
  const instance = new Timer(el);
  instance.$mount();
  await advanceTimersByTimeAsync(50);

  return { el, instance, ...recorder };
}

describe('Timer component', () => {
  beforeEach(() => {
    useFakeTimers();
  });

  afterEach(() => {
    useRealTimers();
  });

  it('should have the correct config', () => {
    expect(Timer.config.name).toBe('Timer');
    expect(Timer.config.emits).toEqual([
      'timer-start',
      'timer-end',
      'timer-tick',
      'timer-pause',
      'timer-resume',
      'timer-stop',
    ]);
  });

  it('should start on mount and emit `timer-start`', async () => {
    const { calls } = await mountTimer({ dataOptionDelay: '2' }, ['timer-start', 'timer-end']);
    expect(calls['timer-start']).toBe(1);
    expect(calls['timer-end']).toBe(0);
  });

  it('should emit `timer-end` once the delay (in seconds) elapsed', async () => {
    const { calls } = await mountTimer({ dataOptionDelay: '2' }, ['timer-end']);
    await advanceTimersByTimeAsync(1000);
    expect(calls['timer-end']).toBe(0);
    await advanceTimersByTimeAsync(1500);
    expect(calls['timer-end']).toBe(1);
  });

  it('should dispatch bubbling events', async () => {
    const el = h('div', { dataComponent: 'Timer', dataOptionDelay: '1' });
    const parent = h('div', [el]);
    let bubbled = 0;
    parent.addEventListener('timer-end', () => {
      bubbled += 1;
    });
    const instance = new Timer(el);
    instance.$mount();
    await advanceTimersByTimeAsync(1050);
    expect(bubbled).toBe(1);
  });

  it('should re-arm and keep emitting when `repeat` is enabled', async () => {
    const { calls } = await mountTimer({ dataOptionDelay: '1', dataOptionRepeat: '' }, [
      'timer-end',
      'timer-tick',
    ]);
    await advanceTimersByTimeAsync(3200);
    expect(calls['timer-end']).toBe(3);
    expect(calls['timer-tick']).toBe(3);
  });

  it('should not autostart when disabled, and start on demand', async () => {
    const { instance, calls } = await mountTimer(
      { dataOptionDelay: '1', dataOptionNoAutostart: '' },
      ['timer-start', 'timer-end'],
    );
    expect(instance.$options.autostart).toBe(false);
    expect(calls['timer-start']).toBe(0);

    instance.start();
    await advanceTimersByTimeAsync(1050);
    expect(calls['timer-start']).toBe(1);
    expect(calls['timer-end']).toBe(1);
  });

  it('should stop without completing', async () => {
    const { instance, calls } = await mountTimer({ dataOptionDelay: '2' }, [
      'timer-stop',
      'timer-end',
    ]);
    instance.stop();
    expect(calls['timer-stop']).toBe(1);
    await advanceTimersByTimeAsync(3000);
    expect(calls['timer-end']).toBe(0);
  });

  it('should pause and resume, preserving the remaining time', async () => {
    const { instance, calls } = await mountTimer({ dataOptionDelay: '2' }, [
      'timer-pause',
      'timer-resume',
      'timer-end',
    ]);

    await advanceTimersByTimeAsync(1000);
    instance.pause();
    expect(calls['timer-pause']).toBe(1);

    // Time passes while paused: the timer must not complete.
    await advanceTimersByTimeAsync(5000);
    expect(calls['timer-end']).toBe(0);

    instance.resume();
    expect(calls['timer-resume']).toBe(1);

    // Only the ~1s that was left should be needed to complete.
    await advanceTimersByTimeAsync(1100);
    expect(calls['timer-end']).toBe(1);
  });

  it('should restart from the beginning', async () => {
    const { instance, calls } = await mountTimer({ dataOptionDelay: '2' }, [
      'timer-start',
      'timer-end',
    ]);

    await advanceTimersByTimeAsync(1500);
    instance.restart();
    expect(calls['timer-start']).toBe(2);

    // The elapsed 1.5s must have been discarded: no completion yet.
    await advanceTimersByTimeAsync(1500);
    expect(calls['timer-end']).toBe(0);

    await advanceTimersByTimeAsync(600);
    expect(calls['timer-end']).toBe(1);
  });

  it('should cancel a pending countdown on destroy', async () => {
    const { instance, calls } = await mountTimer({ dataOptionDelay: '2' }, ['timer-end']);
    await instance.$destroy();
    await advanceTimersByTimeAsync(3000);
    expect(calls['timer-end']).toBe(0);
  });
});
