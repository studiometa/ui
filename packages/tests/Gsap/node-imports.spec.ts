import { expect, test, vi } from 'vitest';

/**
 * The root, dependency and autoload entries must be safe to import under
 * Node, for example in a server render, and must not import GSAP.
 */
vi.mock('gsap', () => {
  throw new Error('gsap must not be imported');
});

vi.mock('gsap/ScrollTrigger', () => {
  throw new Error('gsap/ScrollTrigger must not be imported');
});

test.each([
  ['the root entry', () => import('../../ui-gsap/src/index.ts')],
  ['the dependencies entry', () => import('../../ui-gsap/src/dependencies.ts')],
  ['the manifest entry', () => import('../../ui-gsap/src/manifest.ts')],
  ['the autoload entry', () => import('../../ui-gsap/src/autoload.ts')],
])('%s imports under Node without GSAP', async (_name, load) => {
  expect(typeof document).toBe('undefined');
  await expect(load()).resolves.toBeDefined();
});
