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
  sources: Map<string, Set<DataScopeMember>>;
  values: Map<string, DataValue>;
  data: Readonly<Record<string, DataValue>>;
  hydration: Set<DataScopeMember>;
  hydrationPending: boolean;
}

const EMPTY_DATA = Object.freeze({});

function cloneValue(value: DataValue): DataValue {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  return value;
}

function createSnapshot(values: Map<string, DataValue>): Readonly<Record<string, DataValue>> {
  const entries = Array.from(values, ([key, value]) => {
    const snapshotValue = cloneValue(value);

    if (Array.isArray(snapshotValue) || snapshotValue instanceof Date) {
      Object.freeze(snapshotValue);
    }

    return [key, snapshotValue] as const;
  });

  return Object.freeze(Object.fromEntries(entries));
}

function isCurrentValueSource(instance: DataScopeMember) {
  const { $el } = instance;
  return !($el instanceof HTMLInputElement && $el.type === 'radio' && !$el.checked);
}

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
        sources: new Map(),
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

    const deletedKeys = [] as string[];
    const updatedValues = new Map<string, DataValue>();
    for (const [key, sources] of record.sources) {
      let sourcesChanged = false;
      for (const source of sources) {
        if (!source.$el.isConnected) {
          sources.delete(source);
          sourcesChanged = true;
        }
      }

      if (sources.size === 0) {
        record.sources.delete(key);
        if (record.values.delete(key)) {
          deletedKeys.push(key);
        }
      } else if (sourcesChanged && group.endsWith('[]')) {
        const value = this.getMultipleSourcesValue(sources);
        record.values.set(key, value);
        updatedValues.set(key, value);
      }
    }

    if (deletedKeys.length > 0 || updatedValues.size > 0) {
      record.data = createSnapshot(record.values);
      for (const key of deletedKeys) {
        this.notifyValue(record, key, undefined);
      }
      for (const [key, value] of updatedValues) {
        this.notifyValue(record, key, value);
      }
    }

    return record;
  }

  private getMultipleSourcesValue(sources: Set<DataScopeMember>) {
    const values = new Set<string>();

    for (const source of sources) {
      if (source.$el instanceof HTMLInputElement && source.$el.type === 'checkbox') {
        if (source.$el.checked) {
          values.add(source.$el.value);
        }
        continue;
      }

      const value = source.get();
      if (Array.isArray(value)) {
        for (const item of value) {
          values.add(item);
        }
      }
    }

    return Array.from(values);
  }

  private notifyValue(
    record: DataScopeGroup,
    key: string,
    value: DataValue,
    excludedSource?: DataScopeMember,
  ) {
    const instances = Array.from(record.instances).filter(
      (instance) => instance !== excludedSource && instance.$el.isConnected,
    );
    const dispatcher =
      instances.find((instance) => instance.dataKey === key) ??
      instances.find((instance) => !instance.dataKey);
    dispatcher?.__dispatchScopedValue(value, false);
  }

  getGroup(group: string) {
    return this.getRecord(group).instances;
  }

  getData(group: string) {
    return this.getRecord(group).data;
  }

  setValue(group: string, key: string, value: DataValue, source?: DataScopeMember) {
    const record = this.getRecord(group);

    if (source) {
      if (source.$el instanceof HTMLInputElement && source.$el.type === 'radio') {
        const matchingSource =
          source.$el.value === value
            ? source
            : Array.from(record.instances).find(
                (instance) =>
                  instance.dataKey === key &&
                  instance.$el instanceof HTMLInputElement &&
                  instance.$el.type === 'radio' &&
                  instance.$el.value === value,
              );
        record.sources.set(key, new Set([matchingSource ?? source]));
      } else {
        const sources = record.sources.get(key) ?? new Set();
        sources.add(source);
        record.sources.set(key, sources);
      }
    }

    record.values.set(key, cloneValue(value));
    record.data = createSnapshot(record.values);
  }

  deleteValue(group: string, key: string, source: DataScopeMember) {
    const record = this.getRecord(group);
    const sources = record.sources.get(key);

    if (!sources?.delete(source)) {
      return;
    }

    if (sources.size === 0) {
      record.sources.delete(key);
      record.values.delete(key);
      record.data = createSnapshot(record.values);
      this.notifyValue(record, key, undefined, source);
    } else if (group.endsWith('[]')) {
      const value = this.getMultipleSourcesValue(sources);
      record.values.set(key, value);
      record.data = createSnapshot(record.values);
      this.notifyValue(record, key, value, source);
    }
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
          if (
            source.$isMounted &&
            source.$el.isConnected &&
            source.dataKey &&
            isCurrentValueSource(source)
          ) {
            sources.set(source.dataKey, source);
            record.values.set(source.dataKey, cloneValue(source.get()));

            if (source.$el instanceof HTMLInputElement && source.$el.type === 'radio') {
              record.sources.set(source.dataKey, new Set([source]));
            } else {
              const valueSources = record.sources.get(source.dataKey) ?? new Set();
              valueSources.add(source);
              record.sources.set(source.dataKey, valueSources);
            }
          }
        }
      }

      record.hydration.clear();
      record.hydrationPending = false;
      record.data = createSnapshot(record.values);

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
