import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { DataBind } from './DataBind.js';
import type { DataBindProps } from './DataBind.js';
import type { DataValue } from './DataScope.js';
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

  /**
   * @protected
   */
  get __supportsMutations() {
    return false;
  }

  get compute() {
    const { group, compute } = this.$options;
    return getCallback(group, `return ${compute};`);
  }

  set(value: DataValue) {
    let newValue = value;

    try {
      newValue = this.compute(value, this.target, this.$data);
    } catch (error) {
      // @todo better handling of errors?
      console.error('Failed', error);
    }

    super.set(newValue, false);
  }
}
