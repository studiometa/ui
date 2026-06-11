import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { Track } from '@studiometa/ui';
import {
  h,
  destroy,
  intersectionObserverAfterEachCallback,
  intersectionObserverBeforeAllCallback,
  mockIsIntersecting,
  mount,
} from '#test-utils';

beforeAll(() => {
  intersectionObserverBeforeAllCallback();
});

const publish = vi.fn();

beforeEach(() => {
  // @ts-expect-error the `Shopify` global is only available on Shopify storefronts.
  window.Shopify = { analytics: { publish } };
});

afterEach(() => {
  intersectionObserverAfterEachCallback();
  // @ts-expect-error the `Shopify` global is only available on Shopify storefronts.
  delete window.Shopify;
  publish.mockClear();
});

async function getContext({
  payload = JSON.stringify({ name: 'bloc-name', template: 'index' }),
  attributes = {},
}: { payload?: string; attributes?: Record<string, string> } = {}) {
  const script = h('script', { dataRef: 'payload', type: 'application/json' }, [payload]);
  const link = h('a', { href: '#' }, ['Click me']);
  const root = h('div', attributes, [script, link]);
  const track = new Track(root);
  await mount(track);

  return { root, script, link, track };
}

describe('The Track component', () => {
  it('should publish the viewed event with the payload when intersecting for the first time only', async () => {
    const { root, track } = await getContext();

    await mockIsIntersecting(root, false);
    expect(publish).not.toHaveBeenCalled();

    await mockIsIntersecting(root, true);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith('bento_section_viewed', {
      name: 'bloc-name',
      template: 'index',
    });

    await mockIsIntersecting(root, false);
    await mockIsIntersecting(root, true);
    expect(publish).toHaveBeenCalledTimes(1);

    await destroy(track);
  });

  it('should publish the clicked event with the payload and target infos on click', async () => {
    const { link, track } = await getContext();

    link.click();

    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith('bento_section_clicked', {
      name: 'bloc-name',
      template: 'index',
      url: window.location.href,
      target: 'a',
      target_content: 'Click me',
    });

    await destroy(track);
  });

  it('should use the configured event names', async () => {
    const { root, link, track } = await getContext({
      attributes: {
        dataOptionViewedEvent: 'custom_viewed',
        dataOptionClickedEvent: 'custom_clicked',
      },
    });

    await mockIsIntersecting(root, true);
    link.click();

    expect(publish).toHaveBeenNthCalledWith(1, 'custom_viewed', expect.any(Object));
    expect(publish).toHaveBeenNthCalledWith(2, 'custom_clicked', expect.any(Object));

    await destroy(track);
  });

  it('should warn and publish an empty payload when the payload JSON is invalid', async () => {
    const { root, track } = await getContext({ payload: '{ invalid json' });
    const warn = vi.fn();
    vi.spyOn(track, '$warn', 'get').mockReturnValue(warn);

    await mockIsIntersecting(root, true);

    expect(warn).toHaveBeenCalledWith('Invalid payload JSON');
    expect(publish).toHaveBeenCalledWith('bento_section_viewed', {});

    await destroy(track);
  });

  it('should warn and not fail when the Shopify analytics API is not available', async () => {
    const { root, track } = await getContext();
    const warn = vi.fn();
    vi.spyOn(track, '$warn', 'get').mockReturnValue(warn);
    // @ts-expect-error the `Shopify` global is only available on Shopify storefronts.
    delete window.Shopify;

    await mockIsIntersecting(root, true);

    expect(publish).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('The `Shopify.analytics.publish` API is not available');

    await destroy(track);
  });
});
