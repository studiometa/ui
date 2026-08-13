import type { ComponentCatalog, CuratedComponentMetadata } from '../../../scripts/manifest-types.js';

// Motion is external (import-map resolved) and never bundled, so the component
// declares neither a CDN-served stylesheet nor a bundled integration chunk —
// consumers load the Motion JavaScript from the source their import map points at.
const components: readonly CuratedComponentMetadata[] = [
  { token: 'Motion', group: 'motion' },
  { token: 'MotionScrollTimeline', group: 'motion', children: ['Motion'] },
  { token: 'MotionSequence', group: 'motion', children: ['Motion'] },
  { token: 'MotionView', group: 'motion' },
];

/** The autoload catalog for every declarative `@studiometa/ui-motion` component. */
export const catalog: ComponentCatalog = {
  packageName: '@studiometa/ui-motion',
  strategy: 'visible',
  components,
  abstractExports: [],
};
