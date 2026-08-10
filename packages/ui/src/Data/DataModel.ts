import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { DataBind } from './DataBind.js';
import type { DataBindProps } from './DataBind.js';
import { serializeControlValue } from './formControl.js';

export interface DataModelProps extends DataBindProps {}

export class DataModel<T extends BaseProps = BaseProps> extends DataBind<DataModelProps & T> {
  static config: BaseConfig = {
    name: 'DataModel',
  };

  override get isDataSource() {
    return true;
  }

  dispatch() {
    const value = serializeControlValue(this.__controlContext);
    const publication = this.__publishValue(value, true);

    if (publication.channel.isCurrent(publication.frame)) {
      this.set(value, false);
    }
  }

  onInput() {
    this.dispatch();
  }
}
