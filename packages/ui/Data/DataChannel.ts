import { effect, signal } from 'alien-signals';
import type { DataScopeMember, DataValue } from './DataScope.js';

const INITIAL = Symbol('initial-data-update');

export interface DataUpdate {
  readonly force: boolean;
  readonly key?: string;
  readonly source?: DataScopeMember;
  readonly value: DataValue;
}

type DataUpdateSubscriber = (update: DataUpdate) => void;

/**
 * Synchronously publish Data group updates through a signal-backed channel.
 * @internal
 */
export class DataChannel {
  private update = signal<DataUpdate | typeof INITIAL>(INITIAL);
  private latest?: DataUpdate;

  publish(update: DataUpdate) {
    // Always publish a fresh frame so equal values remain observable events.
    const frame = { ...update };
    this.latest = frame;
    this.update(frame);
    return frame;
  }

  isCurrent(frame: DataUpdate) {
    return this.latest === frame;
  }

  subscribe(subscriber: DataUpdateSubscriber) {
    let initialized = false;

    return effect(() => {
      const update = this.update();

      if (!initialized) {
        initialized = true;
        return;
      }

      if (update !== INITIAL) {
        subscriber(update);
      }
    });
  }
}

type GlobalWithDataChannels = typeof globalThis & {
  __STUDIOMETA_UI_DATA_CHANNELS__?: WeakMap<Set<DataScopeMember>, DataChannel>;
};

/**
 * Get the global Data channel storage so it can be shared between different
 * instances of the package.
 */
function getChannelsStorage() {
  const global = globalThis as GlobalWithDataChannels;
  return (global.__STUDIOMETA_UI_DATA_CHANNELS__ ??= new WeakMap());
}

/**
 * Get the signal channel associated with a legacy Data group.
 * @internal
 */
export function getDataChannel(group: Set<DataScopeMember>) {
  const channels = getChannelsStorage();
  let channel = channels.get(group);

  if (!channel) {
    channel = new DataChannel();
    channels.set(group, channel);
  }

  return channel;
}
