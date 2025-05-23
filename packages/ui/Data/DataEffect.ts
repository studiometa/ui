import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { DataBind } from './DataBind.js';
import type { DataBindProps } from './DataBind.js';
import { getCallback } from './utils.js';

export interface DataEffectProps extends DataBindProps {
  $options: {
    effect: string;
  } & DataBindProps['$options'];
}

export class DataEffect<T extends BaseProps = BaseProps> extends DataBind<DataEffectProps & T> {
  static config: BaseConfig = {
    name: 'DataEffect',
    options: {
      effect: String,
    },
  };

  get effect() {
    const { group, effect } = this.$options;
    return getCallback(group, effect);
  }

  set(value: boolean | string | string[]) {
    try {
      this.effect(value, this.target);
    } catch (error) {
      // @todo better handling of errors?
      console.error('Failed', error);
    }
  }
}
