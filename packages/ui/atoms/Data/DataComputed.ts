import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { isDefined } from '@studiometa/js-toolkit/utils';
import { DataBind } from './DataBind.js';
import type { DataBindProps } from './DataBind.js';

export interface DataComputedProps extends DataBindProps {}

const callbacks = new Map<string, Function>();

export class DataComputed<T extends BaseProps = BaseProps> extends DataBind<DataComputedProps & T> {
  static config: BaseConfig = {
    name: 'DataComputed',
    options: {
      compute: String,
    },
  };

  get compute() {
    const { name, compute } = this.$options;
    const key = compute + name;

    if (!callbacks.has(key)) {
      callbacks.set(key, new Function('value', 'target', `return ${compute};`));
    }

    return callbacks.get(key);
  }

  set value(value) {
    this.set(value);
  }

  set(value) {
    let newValue = value;

    try {
      newValue = this.compute(value, this.target);
    } catch (error) {
      // @todo better handling of errors?
      console.log('Failed', error);
    }

    super.set(newValue);
  }

  get() {
    const value = super.get();
    return value;
  }
}
