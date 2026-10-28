import { vi } from 'vitest';
import { waitFor } from '@studiometa/js-toolkit/test';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { provideGsap } from '@studiometa/ui-gsap/dependencies';

/**
 * A spy over the real `gsap` core. The specs run in Chromium, so the real
 * engine animates the real DOM; the spy only counts the contexts that the
 * components create and revert.
 */
export interface FakeContext {
  context: gsap.Context;
  revert: ReturnType<typeof vi.fn>;
}

/** Every context created since the last {@link resetFakeGsap} call, in order. */
export const contexts: FakeContext[] = [];

export const registerPlugin = vi.fn((...plugins: object[]) => gsap.registerPlugin(...plugins));

const context = vi.fn((func?: gsap.ContextFunc, scope?: Element | string | object) => {
  const created = gsap.context(func, scope);
  const revert = vi.fn(created.revert.bind(created));
  created.revert = revert;
  contexts.push({ context: created, revert });
  return created;
});

/** The `gsap` double: the real core, with spies on `context()` and `registerPlugin()`. */
export const fakeGsap = new Proxy(gsap, {
  get(target, key, receiver) {
    if (key === 'context') {
      return context;
    }

    if (key === 'registerPlugin') {
      return registerPlugin;
    }

    return Reflect.get(target, key, receiver);
  },
}) as typeof gsap;

/** Inject the double with the real `ScrollTrigger` plugin. */
export function provideFakeGsap() {
  provideGsap({ gsap: fakeGsap, ScrollTrigger });
}

/** The contexts that are still active. */
export function activeContexts() {
  return contexts.filter(({ revert }) => revert.mock.calls.length === 0);
}

/**
 * Wait for the first animation of a component. GSAP animations are thenables
 * that settle when they complete, so a promise cannot resolve to one: read it
 * from the component after the wait.
 */
export async function ready(instance: { animation: gsap.core.Animation | null }): Promise<void> {
  await waitFor(() => instance.animation !== null);
}

export function resetFakeGsap() {
  contexts.length = 0;
  context.mockClear();
  registerPlugin.mockClear();
}

provideFakeGsap();

export { gsap, ScrollTrigger };
