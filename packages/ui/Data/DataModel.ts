import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { DataBind } from './DataBind.js';
import type { DataBindProps } from './DataBind.js';
import { serializeControlValue } from './formControl.js';

export interface DataModelProps extends DataBindProps {}

export class DataModel<T extends BaseProps = BaseProps> extends DataBind<DataModelProps & T> {
  static config: BaseConfig = {
    name: 'DataModel',
  };

  dispatch() {
    const value = serializeControlValue(this.controlContext);
    const publication = this.publishValue(value, true);

    if (publication.channel.isCurrent(publication.frame)) {
      this.set(value, false);
    }
  }

  onInput() {
    this.dispatch();
  }
}
