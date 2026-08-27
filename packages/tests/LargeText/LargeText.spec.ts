import { afterEach, describe, expect, it } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { frames, resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { LargeText } from '#private/LargeText/LargeText.js';

registerComponents(LargeText);

afterEach(resetDom);

/**
 * Render a marquee whose target has a real width. The component measures
 * `clientWidth` and loops over exactly that distance, so the geometry is the
 * behaviour rather than a detail of it — which is why this spec only means
 * anything in a browser.
 */
async function render(attributes = ''): Promise<HTMLElement> {
  const root = document.createElement('div');
  root.innerHTML = `
    <div data-component="LargeText" ${attributes} style="width: 200px; overflow: hidden">
      <span data-ref="target" style="display: inline-block; width: 400px">Scrolling text</span>
    </div>
  `;
  document.body.append(root);
  await settle();
  return root.firstElementChild as HTMLElement;
}

function instanceOf(element: HTMLElement): LargeText {
  return getInstance<LargeText>(element, 'LargeText')!;
}

describe('LargeText', () => {
  it('mounts through the in-view strategy and measures its target', async () => {
    const element = await render();
    const largeText = instanceOf(element);

    expect(largeText).toBeDefined();
    expect(largeText.$isMounted).toBe(true);
    // v3 passed `{ rootMargin: '50%' }` to `withMountWhenInView`; v4 carries the
    // same margin on the strategy name.
    expect(LargeText.config.mountStrategy).toBe('in-view:50%');
    expect(largeText.width).toBe(400);
  });

  it('travels even while the page is still', async () => {
    const largeText = instanceOf(await render());

    const written = await waitFor(() => {
      const { transform } = largeText.$refs.target.style;
      return transform === '' ? false : transform;
    });

    expect(written).toContain('translate3d');
    expect(largeText.x).toBeLessThan(0);
  });

  it('reverses with a negative sensitivity', async () => {
    const largeText = instanceOf(await render('data-option-sensitivity="-1"'));

    await frames(4);

    expect(largeText.x).toBeGreaterThan(0);
  });

  it('loops back once it has travelled the target width', async () => {
    const largeText = instanceOf(await render());

    // One frame short of a full loop, then the frame that crosses it.
    largeText.x = -largeText.width + 1;
    await frames(3);

    expect(largeText.x).toBeGreaterThan(-largeText.width);
  });

  it('re-measures on resize', async () => {
    const largeText = instanceOf(await render());
    expect(largeText.width).toBe(400);

    largeText.$refs.target.style.width = '640px';
    largeText.resized();

    expect(largeText.width).toBe(640);
  });

  it('skews only when the option asks for it', async () => {
    const plain = instanceOf(await render());
    plain.deltaY = 40;
    await frames(4);
    expect(plain.transform.skewX).toBe(0);

    await resetDom();

    const skewed = instanceOf(await render('data-option-skew'));
    skewed.deltaY = 40;
    const skewX = await waitFor(() => skewed.transform.skewX !== 0 && skewed.transform.skewX);
    expect(skewX).toBeLessThan(0);
  });
});
