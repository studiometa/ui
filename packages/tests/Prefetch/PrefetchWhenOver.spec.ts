import { describe, it, expect, vi } from 'vitest';
import { PrefetchWhenOver } from '@studiometa/ui';
import { h, mount } from '#test-utils';

describe('The PrefetchWhenOver class', () => {
  it('should prefetch on mouseenter', async () => {
    const anchor = h('a', { href: 'http://fqdn.com/' });
    const prefetch = new PrefetchWhenOver(anchor);
    await mount(prefetch);

    const spy = vi.spyOn(prefetch, 'prefetch');
    spy.mockImplementation(() => undefined)
    anchor.dispatchEvent(new MouseEvent('mouseenter'));
    expect(spy).toHaveBeenCalledOnce();
  });
});
