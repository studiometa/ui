import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { DataBind } from './DataBind.js';
import type { DataBindProps } from './DataBind.js';

export interface DataModelProps extends DataBindProps {}

export class DataModel<T extends BaseProps = BaseProps> extends DataBind<DataModelProps & T> {
  static config: BaseConfig = {
    name: 'DataModel',
  };

  onInput() {
    const value = this.get();
    for (const instance of this.relatedInstances) {
      instance.set(value);
    }
  }
}
