import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { DataBind } from './DataBind.js';
import type { DataBindProps } from './DataBind.js';
import { getCallback } from './utils.js';

export interface DataComputedProps extends DataBindProps {
  $options: {
    compute: string;
  } & DataBindProps['$options'];
}

export class DataComputed<T extends BaseProps = BaseProps> extends DataBind<DataComputedProps & T> {
  static config: BaseConfig = {
    name: 'DataComputed',
    options: {
      compute: String,
    },
  };

  get compute() {
    const { group, compute } = this.$options;
    return getCallback(group, `return ${compute};`);
  }

  set(value: boolean | string | string[]) {
    let newValue = value;

    try {
      newValue = this.compute(value, this.target);
    } catch (error) {
      // @todo better handling of errors?
      console.error('Failed', error);
    }

    super.set(newValue, false);
  }
}
