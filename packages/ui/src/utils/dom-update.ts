import type { Base } from '@studiometa/js-toolkit';

/**
 * A component able to run a DOM change inside its own transition — the
 * duck-typed handshake of the `dom-update` protocol. `MotionView` from
 * `@studiometa/ui-motion` is one; any object exposing `update(mutate)` works.
 */
export interface DomUpdateTransitioner {
  update(mutate: () => void | Promise<void>): void | Promise<unknown>;
}

/**
 * What `wrap()` accepts: a function receiving the `apply` callback, or a
 * transitioner whose `update()` receives it.
 */
export type DomUpdateRunner =
  | ((apply: () => void) => void | Promise<unknown>)
  | DomUpdateTransitioner;

/**
 * Emit the bubbling `dom-update` protocol event announcing an imminent DOM
 * change, and return the runner registered by a listener through
 * `detail.wrap()`, normalized to a function — or `null` when nobody wrapped.
 *
 * `wrap()` only accepts registrations synchronously while the event
 * dispatches — later calls warn and are ignored — and keeps a single runner:
 * the last call wins.
 *
 * The event is dispatched directly on the element instead of `$emit` because
 * `Fetch` overrides `$emit` with a string-only signature that would mangle a
 * `CustomEvent` instance.
 */
export function emitDomUpdate(
  instance: Base,
  detail: Record<string, unknown> = {},
): ((apply: () => void) => void | Promise<unknown>) | null {
  let runner: DomUpdateRunner | null = null;
  let dispatching = true;

  function wrap(newRunner: DomUpdateRunner) {
    if (!dispatching) {
      instance.$warn(
        '`wrap` must be called synchronously while the `dom-update` event dispatches.',
      );
      return;
    }
    runner = newRunner;
  }

  instance.$el.dispatchEvent(
    new CustomEvent('dom-update', { detail: { ...detail, wrap }, bubbles: true }),
  );
  dispatching = false;

  if (runner && typeof (runner as DomUpdateTransitioner).update === 'function') {
    const transitioner = runner as DomUpdateTransitioner;
    return (apply) => transitioner.update(apply);
  }

  return runner as ((apply: () => void) => void | Promise<unknown>) | null;
}

/**
 * Run a DOM change through a registered runner without ever losing it: when
 * the runner throws or rejects, the change is applied directly and the error
 * is reported through `$warn`.
 */
export async function runWrapped(
  instance: Base,
  runner: (apply: () => void) => void | Promise<unknown>,
  applyChange: () => void,
): Promise<void> {
  let applied = false;
  function apply() {
    applied = true;
    applyChange();
  }
  try {
    await runner(apply);
  } catch (error) {
    instance.$warn('The `dom-update` runner rejected.', error);
    if (!applied) {
      apply();
    }
  }
}
