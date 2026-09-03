import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { resetDom, settle } from '@studiometa/js-toolkit/test';
import { ScrollReveal } from '#private/ScrollReveal/ScrollReveal.js';
import {
  intersectionObserverAfterEachCallback,
  intersectionObserverBeforeAllCallback,
  mockIsIntersecting,
} from '#test-utils';

registerComponents(ScrollReveal);

beforeAll(intersectionObserverBeforeAllCallback);

afterEach(async () => {
  await resetDom();
  intersectionObserverAfterEachCallback();
});

async function render(attributes = '', inner = ''): Promise<HTMLElement> {
  const root = document.createElement('div');
  root.innerHTML = `<div data-component="ScrollReveal" ${attributes}>${inner}</div>`;
  document.body.append(root);
  await settle();
  return root.firstElementChild as HTMLElement;
}

function instanceOf(element: HTMLElement): ScrollReveal {
  return getInstance<ScrollReveal>(element, 'ScrollReveal')!;
}

/** Move the page and let the scroll service read the new position. */
async function scrollTo(y: number): Promise<void> {
  window.scrollY = y;
  window.dispatchEvent(new Event('scroll'));
  await settle();
}

describe('ScrollReveal', () => {
  it('reveals when its element enters the viewport, and not before', async () => {
    const element = await render();
    const scrollReveal = instanceOf(element);
    const enter = vi.spyOn(scrollReveal, 'enter').mockResolvedValue();

    await mockIsIntersecting(element, false);
    expect(enter).not.toHaveBeenCalled();

    await mockIsIntersecting(element, true);
    expect(enter).toHaveBeenCalledOnce();
  });

  it('reveals only once without the repeat option', async () => {
    const element = await render();
    const scrollReveal = instanceOf(element);
    const enter = vi.spyOn(scrollReveal, 'enter').mockResolvedValue();

    await mockIsIntersecting(element, true);
    await mockIsIntersecting(element, false);
    await mockIsIntersecting(element, true);

    expect(enter).toHaveBeenCalledOnce();
  });

  it('reveals on every entry with the repeat option', async () => {
    const element = await render('data-option-repeat');
    const scrollReveal = instanceOf(element);
    const enter = vi.spyOn(scrollReveal, 'enter').mockResolvedValue();

    await mockIsIntersecting(element, true);
    await mockIsIntersecting(element, false);
    await mockIsIntersecting(element, true);

    expect(enter).toHaveBeenCalledTimes(2);
  });

  it('skips a repeated reveal while the page scrolls back up', async () => {
    const element = await render('data-option-repeat');
    const scrollReveal = instanceOf(element);
    const enter = vi.spyOn(scrollReveal, 'enter').mockResolvedValue();

    await mockIsIntersecting(element, true);
    expect(enter).toHaveBeenCalledOnce();

    await scrollTo(500);
    await mockIsIntersecting(element, false);
    await mockIsIntersecting(element, true);
    expect(enter).toHaveBeenCalledTimes(2);

    await scrollTo(0);
    await mockIsIntersecting(element, false);
    await mockIsIntersecting(element, true);
    expect(enter).toHaveBeenCalledTimes(2);
  });

  it('transitions the target ref when there is one', async () => {
    const element = await render('', '<span data-ref="target"></span>');
    const scrollReveal = instanceOf(element);

    expect(scrollReveal.target).toBe(element.querySelector('[data-ref="target"]'));
  });

  it('transitions its own element when there is no target ref', async () => {
    const element = await render();

    expect(instanceOf(element).target).toBe(element);
  });

  it('keeps the entered state by default', async () => {
    const element = await render();

    expect(instanceOf(element).$options.enterKeep).toBe(true);
  });

  it('passes the intersectionObserver option to the observer', async () => {
    const element = await render(`data-option-intersection-observer='{"rootMargin":"-25%"}'`);
    const scrollReveal = instanceOf(element);

    expect(scrollReveal.$options.intersectionObserver).toEqual({ rootMargin: '-25%' });
    expect(vi.mocked(globalThis.IntersectionObserver).mock.calls.at(-1)?.[1]).toEqual({
      rootMargin: '-25%',
    });
  });

  it('applies the enter classes to its target', async () => {
    const element = await render(
      'data-option-enter-from="opacity-0" data-option-enter-to="opacity-100"',
    );

    await mockIsIntersecting(element, true);
    await settle();

    expect(element.classList.contains('opacity-100')).toBe(true);
  });
});
