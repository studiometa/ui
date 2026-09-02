import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig } from '@studiometa/js-toolkit';

/** Marker component that makes its element addressable by `Action`. */
export class Target extends Base {
  static config: BaseConfig = {
    name: 'Target',
  };
}
