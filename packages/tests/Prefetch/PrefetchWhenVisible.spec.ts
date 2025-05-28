import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { PrefetchWhenVisible } from '@studiometa/ui';
import {
  h,
  intersectionObserverAfterEachCallback,
  intersectionObserverBeforeAllCallback,
  mockIsIntersecting,
  wait,
} from '#test-utils';

beforeAll(() => {
  intersectionObserverBeforeAllCallback();
});

afterEach(() => {
  intersectionObserverAfterEachCallback();
});

describe('The PrefetchWhenVisible class', () => {
  it('should prefetch on mouseenter', async () => {
    const anchor = h('a', { href: 'http://fqdn.com/' });
    const prefetch = new PrefetchWhenVisible(anchor);
    const spy = vi.spyOn(prefetch, 'prefetch');
    spy.mockImplementation(() => undefined);

    mockIsIntersecting(anchor, true);
    await wait(16);
    expect(spy).toHaveBeenCalledOnce();
  });
});
