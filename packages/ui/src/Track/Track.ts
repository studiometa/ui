import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractTrack, type AbstractTrackProps } from './AbstractTrack.js';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export type TrackProps = AbstractTrackProps;

/**
 * Pushes tracking payloads to `window.dataLayer`.
 * Compatible with GTM and other `dataLayer` consumers.
 *
 * @example
 * ```html
 * <button data-component="Track" data-track:click='{"event": "cta_click"}'>Subscribe</button>
 * <div data-component="Track" data-track:view.once='{"event": "impression"}'>Product card</div>
 * ```
 */
export class Track<T extends BaseProps = BaseProps> extends AbstractTrack<T> {
  static config: BaseConfig = {
    name: 'Track',
  };

  dispatch(payload: Record<string, unknown>): void {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Track`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Track;
