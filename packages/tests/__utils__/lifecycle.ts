import { jest } from '@jest/globals';
import type { Base } from '@studiometa/js-toolkit';

export async function mount(...components: Base[]) {
  jest.useFakeTimers();
  for (const component of components) {
    component.$mount();
  }

  await jest.advanceTimersByTimeAsync(100);
  jest.useRealTimers();
}

export async function destroy(...components: Base[]) {
  jest.useFakeTimers();
  for (const component of components) {
    component.$destroy();
  }

  await jest.advanceTimersByTimeAsync(100);
  jest.useRealTimers();
}
