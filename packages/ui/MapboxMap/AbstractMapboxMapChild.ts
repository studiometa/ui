import { Base, BaseProps } from '@studiometa/js-toolkit';
import type { MapboxMap } from './MapboxMap.js';

export interface AbstractMapboxMapChildProps extends BaseProps {
  $parent: MapboxMap;
}

export class AbstractMapboxMapChild<T extends BaseProps = BaseProps> extends Base<T & AbstractMapboxMapChildProps> {
  get map() {
    const { map } = this.$parent;

    if (!map) {
      this.$warn('Can not find the parent map, does this component has a parent MapboxMap component?');
    }

    return map;
  }
}
