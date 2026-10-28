import type {
  ComponentCatalog,
  CuratedComponentMetadata,
} from '../../../scripts/manifest-types.js';

// GSAP is a peer dependency that stays external: the components import it
// lazily, and a host can inject it with `provideGsap()`.
//
// Every component is `eager`, which is also the strategy its class declares,
// so the manifest and the class agree:
//
// - `Gsap` and `GsapTimeline` apply their starting state when they build, so
//   they must build before the element is first seen. A viewport strategy
//   would show the final state first. Viewport-driven playback is the
//   `scrollTrigger` option.
// - `GsapStep` must be mounted when its timeline builds, and a step deep in a
//   tall timeline is far below the viewport then.
const components: readonly CuratedComponentMetadata[] = [
  { token: 'Gsap', group: 'gsap' },
  { token: 'GsapTimeline', group: 'gsap', children: ['GsapStep'] },
  { token: 'GsapStep', group: 'gsap' },
];

/** The autoload catalog for every declarative `@studiometa/ui-gsap` component. */
export const catalog: ComponentCatalog = {
  packageName: '@studiometa/ui-gsap',
  strategy: 'eager',
  components,
  abstractExports: [],
};
