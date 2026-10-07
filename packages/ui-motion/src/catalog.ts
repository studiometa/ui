import type {
  ComponentCatalog,
  CuratedComponentMetadata,
} from '../../../scripts/manifest-types.js';

// Motion is external (import-map resolved) and never bundled, so the component
// declares neither a CDN-served stylesheet nor a bundled integration chunk —
// consumers load the Motion JavaScript from the source their import map points at.
//
// Every component is `eager`: it mounts because its element is on the page,
// which is also the strategy its class declares by default, so the manifest
// and the class agree for every element. A viewport strategy fails each of
// them:
//
// - `Motion` applies its `initial` styles on mount, so they must be in place
//   before the element is first seen, or the final state flashes. A `Motion`
//   inside a closed `<dialog>` must also exist before the dialog opens, for an
//   `Action` that plays it. Viewport-driven playback is its `inView` option.
// - `MotionScrollTimeline` links its `Motion` children once, when it mounts,
//   and a child deep in a tall timeline is far below the viewport then.
//   `MotionSequence` builds its animation from its children the same way.
// - `MotionView` changes its element's visibility: its `leaveTo` class often
//   starts it out not rendered, and it must already listen when a containing
//   `Dialog` opens or a descendant announces a DOM update.
//
// `MotionView` imports the Motion library only on its first `update()`; the
// other components import it on mount.
const components: readonly CuratedComponentMetadata[] = [
  { token: 'Motion', group: 'motion' },
  { token: 'MotionScrollTimeline', group: 'motion', children: ['Motion'] },
  { token: 'MotionSequence', group: 'motion', children: ['Motion'] },
  { token: 'MotionView', group: 'motion' },
];

/** The autoload catalog for every declarative `@studiometa/ui-motion` component. */
export const catalog: ComponentCatalog = {
  packageName: '@studiometa/ui-motion',
  strategy: 'eager',
  components,
  abstractExports: [],
};
