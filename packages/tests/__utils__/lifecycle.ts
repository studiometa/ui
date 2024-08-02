import { vi } from 'vitest';
import type { Base } from '@studiometa/js-toolkit';

export async function mount(...components: Base[]) {
  vi.useFakeTimers();
  for (const component of components) {
    component.$mount();
  }

  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();
}

export async function destroy(...components: Base[]) {
  vi.useFakeTimers();
  for (const component of components) {
    component.$destroy();
  }

  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();
}
