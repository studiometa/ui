import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { nextTick } from '@studiometa/js-toolkit/utils';

export interface DataScopeProps extends BaseProps {
  $options: {
    group: string;
  };
}

export type DataValue = boolean | string | string[] | number | Date | null | undefined;

export interface DataScopeMember extends Base {
  readonly dataKey: string;
  get(): DataValue;
  __dispatchScopedValue(value: DataValue, updateData?: boolean): void;
}

interface DataScopeGroup {
  instances: Set<DataScopeMember>;
  values: Map<string, DataValue>;
  data: Readonly<Record<string, DataValue>>;
  hydration: Set<DataScopeMember>;
  hydrationPending: boolean;
}

const EMPTY_DATA = Object.freeze({});

/**
 * Define a local boundary and a default group for descendant Data components.
 * @link https://ui.studiometa.dev/components/DataScope/
 */
export class DataScope<T extends BaseProps = BaseProps> extends Base<DataScopeProps & T> {
  static config: BaseConfig = {
    name: 'DataScope',
    options: {
      group: {
        type: String,
        default: 'default',
      },
    },
  };

  private groups = new Map<string, DataScopeGroup>();

  private getRecord(group: string) {
    let record = this.groups.get(group);

    if (!record) {
      record = {
        instances: new Set(),
        values: new Map(),
        data: EMPTY_DATA,
        hydration: new Set(),
        hydrationPending: false,
      };
      this.groups.set(group, record);
    }

    for (const instance of record.instances) {
      if (!instance.$el.isConnected) {
        record.instances.delete(instance);
      }
    }

    return record;
  }

  getGroup(group: string) {
    return this.getRecord(group).instances;
  }

  getData(group: string) {
    return this.getRecord(group).data;
  }

  setValue(group: string, key: string, value: DataValue) {
    const record = this.getRecord(group);
    record.values.set(key, value);
    record.data = Object.freeze(Object.fromEntries(record.values));
  }

  deleteValue(group: string, key: string) {
    const record = this.getRecord(group);
    const remainingSource = Array.from(record.instances).find(
      (instance) => instance.dataKey === key,
    );

    if (remainingSource) {
      record.values.set(key, remainingSource.get());
    } else {
      record.values.delete(key);
    }

    record.data = Object.freeze(Object.fromEntries(record.values));
  }

  hydrate(group: string, instance: DataScopeMember) {
    const record = this.getRecord(group);
    record.hydration.add(instance);

    if (record.hydrationPending) {
      return;
    }

    record.hydrationPending = true;
    nextTick().then(() => {
      const sources = new Map<string, DataScopeMember>();

      if (this.$isMounted) {
        for (const source of record.hydration) {
          if (source.$isMounted && source.$el.isConnected && source.dataKey) {
            sources.set(source.dataKey, source);
            record.values.set(source.dataKey, source.get());
          }
        }
      }

      record.hydration.clear();
      record.hydrationPending = false;
      record.data = Object.freeze(Object.fromEntries(record.values));

      for (const source of sources.values()) {
        source.__dispatchScopedValue(source.get(), false);
      }
    });
  }
}

type ElementWithInstances = HTMLElement & {
  __base__?: Map<string, Base | 'terminated'>;
};

/**
 * Find the nearest DataScope mounted on the given element or one of its ancestors.
 * @internal
 */
export function getDataScope(element: HTMLElement): DataScope | undefined {
  let current: ElementWithInstances | null = element;

  while (current) {
    const scope = current.__base__?.get(DataScope.config.name);
    if (scope && scope !== 'terminated') {
      return scope as DataScope;
    }
    current = current.parentElement;
  }

  return undefined;
}
