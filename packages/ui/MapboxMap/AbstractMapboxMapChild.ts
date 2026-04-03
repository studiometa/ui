import { Base, BaseProps } from '@studiometa/js-toolkit';
import type { MapboxMap } from './MapboxMap.js';

export interface AbstractMapboxMapChildProps extends BaseProps {}

export class AbstractMapboxMapChild<T extends BaseProps = BaseProps> extends Base<T & AbstractMapboxMapChildProps> {
  get mapboxMap() {
    const mapboxMap = this.$closest<MapboxMap>('MapboxMap');

    if (!mapboxMap) {
      this.$warn('Can not find the parent map, does this component has a parent MapboxMap component?');
    }

    return mapboxMap;
  }

  get map() {
    return this.mapboxMap?.map;
  }
}
