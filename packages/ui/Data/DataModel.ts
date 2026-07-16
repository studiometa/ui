import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { DataBind } from './DataBind.js';
import type { DataBindProps } from './DataBind.js';
import { isCheckbox } from './utils.js';

export interface DataModelProps extends DataBindProps {}

export class DataModel<T extends BaseProps = BaseProps> extends DataBind<DataModelProps & T> {
  static config: BaseConfig = {
    name: 'DataModel',
  };

  override get isDataSource() {
    return true;
  }

  dispatch() {
    const { target, multiple } = this;
    let value = this.getTargetValue();

    if (multiple && isCheckbox(target) && !target.checked && Array.isArray(value)) {
      const set = new Set(value);
      set.delete(target.value);
      value = Array.from(set);
    }

    if (this.dataScope && this.dataKey) {
      this.set(value);
      return;
    }

    for (const instance of this.relatedInstances) {
      instance.set(value, false);
    }
  }

  onInput() {
    this.dispatch();
  }
}
