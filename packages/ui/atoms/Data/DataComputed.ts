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
      callbacks.set(key, new Function(name, `return ${compute};`));
    }

    return callbacks.get(key);
  }

  set value(value) {
    this.set(value);
  }

  set(value) {
    super.set(this.compute(value));
  }

  get() {
    const value = super.get();
    return value;
  }
}
