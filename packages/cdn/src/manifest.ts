import { composeManifests } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';

export type {
  ComponentManifest,
  ComponentManifestEntry,
  ComponentLoadStrategy,
} from '@studiometa/ui-autoload';

/**
 * The ordered manifests the CDN autoloads: `@studiometa/ui` first, then `@studiometa/ui-mapbox`.
 * Every package owns and generates its own manifest; the CDN only composes them.
 */
export const componentManifests = [uiManifest, mapboxManifest] as const;

/**
 * The single composed manifest served by the CDN. Later manifests win on token collision, but the
 * two packages share no tokens so composition is a plain merge here.
 */
export const componentManifest = composeManifests(componentManifests);
