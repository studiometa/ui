import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Base, getInstance, registerComponents, type BaseConfig } from '@studiometa/js-toolkit';
import { captureDiagnostics, mount, resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Defer } from '#private/Defer/Defer.js';

/** A probe, so an injected component can prove it mounted. */
class Probe extends Base {
  static config: BaseConfig = { name: 'Probe' };

  static mounts = 0;

  mounted(): void {
    Probe.mounts += 1;
  }
}

registerComponents(Defer, Probe);

declare global {
  interface Window {
    __lazyScriptRuns?: number;
  }
}

const originalFetch = window.fetch;

beforeEach(() => {
  Probe.mounts = 0;
  window.__lazyScriptRuns = 0;
});

afterEach(async () => {
  window.fetch = originalFetch;
  delete window.__lazyScriptRuns;
  await resetDom();
});

/** Replace `window.fetch` with one that answers every request with `body`. */
function stubFetch(body: string, ok = true): ReturnType<typeof vi.fn> {
  const client = vi.fn(async () => new Response(body, { status: ok ? 200 : 500 }));
  window.fetch = client as unknown as typeof fetch;
  return client;
}

/** Replace `window.fetch` with one the spec resolves by hand. */
function deferFetch(): { client: ReturnType<typeof vi.fn>; resolve: (body: string) => void } {
  let release: ((body: string) => void) | undefined;
  const client = vi.fn(
    async () =>
      new Promise<Response>((resolveResponse) => {
        release = (body: string) => resolveResponse(new Response(body));
      }),
  );
  window.fetch = client as unknown as typeof fetch;
  return {
    client,
    resolve(body: string) {
      release?.(body);
    },
  };
}

/** Reject every request. */
function stubFailure(): ReturnType<typeof vi.fn> {
  const client = vi.fn(async () => {
    throw new Error('offline');
  });
  window.fetch = client as unknown as typeof fetch;
  return client;
}

/**
 * A bounded quiet period, for the assertions that no request was made and no
 * load was recorded. Everything else polls for the state it expects.
 */
async function quiet(): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await settle();
  }
}

describe('Defer', () => {
  it('fetches the `src` option on mount and injects the response', async () => {
    const client = stubFetch('<p>remote</p>');
    const root = await mount(`<div data-component="Defer" data-option-src="/lazy.html"></div>`);
    await waitFor(() => client.mock.calls.length > 0);

    expect(client).toHaveBeenCalledWith('/lazy.html');
    expect(root.firstElementChild?.innerHTML.trim()).toBe('<p>remote</p>');
  });

  it('hides the `loading` ref once the content lands', async () => {
    const deferred = deferFetch();
    const root = await mount(
      `<div data-component="Defer" data-option-src="/lazy.html">
        <span data-ref="loading">Loading…</span>
      </div>`,
    );
    const loading = root.querySelector<HTMLElement>('[data-ref="loading"]');
    expect(loading?.style.display).toBe('');

    deferred.resolve('<p>remote</p>');
    await waitFor(() => loading?.style.display === 'none');

    // The ref was hidden before the swap removed it with the rest.
    expect(loading?.style.display).toBe('none');
  });

  it('reveals the `error` ref when the request fails', async () => {
    stubFailure();
    const root = await mount(
      `<div data-component="Defer" data-option-src="/lazy.html">
        <span data-ref="error" style="display:none">Boom</span>
      </div>`,
    );
    await waitFor(
      () => root.querySelector<HTMLElement>('[data-ref="error"]')?.style.display === 'block',
    );

    expect(root.querySelector<HTMLElement>('[data-ref="error"]')?.style.display).toBe('block');
  });

  it('emits content, then always', async () => {
    stubFetch('<p>remote</p>');
    const seen: string[] = [];
    document.addEventListener('defer-content', () => seen.push('defer-content'));
    document.addEventListener('defer-always', () => seen.push('defer-always'));

    await mount(`<div data-component="Defer" data-option-src="/lazy.html"></div>`);
    await waitFor(() => seen.length === 2);

    expect(seen).toEqual(['defer-content', 'defer-always']);
  });

  it('emits always only once the content is in the DOM', async () => {
    stubFetch('<p>remote</p>');
    let contentWhenAlways: string | undefined;
    document.addEventListener('defer-always', (event) => {
      contentWhenAlways = (event.target as HTMLElement).innerHTML;
    });

    await mount(`<div data-component="Defer" data-option-src="/lazy.html"></div>`);
    await waitFor(() => contentWhenAlways);

    // `$emit()` returns before an async listener has finished, so an `always`
    // announced from the fetch chain alone would arrive on an empty element.
    expect(contentWhenAlways).toContain('<p>remote</p>');
  });

  it('emits error, then always, when the request fails', async () => {
    stubFailure();
    const seen: string[] = [];
    document.addEventListener('defer-error', () => seen.push('defer-error'));
    document.addEventListener('defer-always', () => seen.push('defer-always'));

    await mount(`<div data-component="Defer" data-option-src="/lazy.html"></div>`);
    await waitFor(() => seen.length === 2);

    expect(seen).toEqual(['defer-error', 'defer-always']);
  });

  it('carries the content on the event payload', async () => {
    stubFetch('<p>remote</p>');
    let detail: { content: string } | undefined;
    document.addEventListener('defer-content', (event) => {
      detail = (event as CustomEvent<{ content: string }>).detail;
    });

    await mount(`<div data-component="Defer" data-option-src="/lazy.html"></div>`);
    await waitFor(() => detail);

    expect(detail?.content).toBe('<p>remote</p>');
  });

  it('records the load when `terminateOnLoad` is set, and stays mounted', async () => {
    const deferred = deferFetch();
    const root = await mount(
      `<div data-component="Defer" data-option-src="/lazy.html" data-option-terminate-on-load></div>`,
    );
    const instance = getInstance<Defer>(root.firstElementChild as HTMLElement, 'Defer')!;
    expect(instance.hasLoaded).toBe(false);

    deferred.resolve('<p>remote</p>');
    await waitFor(() => instance.hasLoaded);

    // The component is not ended: it remembers, which is what the option
    // means and what survives the move the next spec makes.
    expect(instance.hasLoaded).toBe(true);
    expect(instance.$isMounted).toBe(true);
  });

  it('records nothing without `terminateOnLoad`', async () => {
    const deferred = deferFetch();
    const root = await mount(`<div data-component="Defer" data-option-src="/lazy.html"></div>`);
    const instance = getInstance<Defer>(root.firstElementChild as HTMLElement, 'Defer')!;

    deferred.resolve('<p>remote</p>');
    await quiet();

    expect(instance.hasLoaded).toBe(false);
    expect(instance.$isMounted).toBe(true);
  });

  it('warns and fetches nothing without a `src` option', async () => {
    const client = stubFetch('<p>remote</p>');
    const log = captureDiagnostics();

    await mount(`<div data-component="Defer"></div>`);
    await quiet();

    expect(client).not.toHaveBeenCalled();
    expect(log.codes).toEqual(['defer.missing-src']);
    log.stop();
  });

  /**
   * `swap()` runs the injected scripts and awaits the lifecycle; assigning
   * `innerHTML` would do neither.
   */
  it('runs a script that arrives with the included content', async () => {
    stubFetch('<script>window.__lazyScriptRuns = (window.__lazyScriptRuns ?? 0) + 1;</script>');

    await mount(`<div data-component="Defer" data-option-src="/lazy.html"></div>`);
    await waitFor(() => window.__lazyScriptRuns === 1);

    expect(window.__lazyScriptRuns).toBe(1);
  });

  it('mounts a component that arrives with the included content', async () => {
    stubFetch('<span data-component="Probe"></span>');

    await mount(`<div data-component="Defer" data-option-src="/lazy.html"></div>`);
    await waitFor(() => Probe.mounts === 1);

    expect(Probe.mounts).toBe(1);
  });

  /**
   * A move is an unmount plus a mount, and `mounted()` is where the request
   * lives, so the one-shot side effect repeats. That cost is asserted rather
   * than hidden.
   */
  it('fetches again when the element is moved, because a move remounts', async () => {
    const client = stubFetch('<p>remote</p>');
    const root = await mount(`<div data-component="Defer" data-option-src="/lazy.html"></div>`);
    await waitFor(() => client.mock.calls.length === 1);
    expect(client).toHaveBeenCalledTimes(1);

    const other = document.createElement('section');
    document.body.append(other);
    other.append(root.firstElementChild as HTMLElement);
    await waitFor(() => client.mock.calls.length === 2);

    expect(client).toHaveBeenCalledTimes(2);
  });

  /**
   * The load is recorded in a field, and the instance stays on its element
   * across a move, so "already loaded" travels with it. A failed load never
   * sets that field, so the next mount cycle tries again.
   */
  it('fetches again after a failed load, whatever `terminateOnLoad` says', async () => {
    const client = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', client);
    const root = await mount(
      `<div data-component="Defer" data-option-src="/lazy.html" data-option-terminate-on-load></div>`,
    );
    const el = root.firstElementChild as HTMLElement;
    await waitFor(() => client.mock.calls.length === 1);
    expect(getInstance<Defer>(el, 'Defer')!.hasLoaded).toBe(false);

    const other = document.createElement('section');
    document.body.append(other);
    other.append(el);
    await waitFor(() => client.mock.calls.length === 2);

    // A request that failed is the one worth retrying on the next mount.
    expect(client).toHaveBeenCalledTimes(2);
  });

  it('does not fetch again once `terminateOnLoad` has been honoured', async () => {
    const client = stubFetch('<p>remote</p>');
    const root = await mount(
      `<div data-component="Defer" data-option-src="/lazy.html" data-option-terminate-on-load></div>`,
    );
    const el = root.firstElementChild as HTMLElement;
    await waitFor(() => getInstance<Defer>(el, 'Defer')!.hasLoaded);

    const other = document.createElement('section');
    document.body.append(other);
    other.append(el);
    await quiet();

    expect(client).toHaveBeenCalledTimes(1);
  });
});
