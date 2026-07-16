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

    return record;
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
        record.sources.set(key, new Set([source]));
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
