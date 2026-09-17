import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import {
  captureDiagnostics,
  mount,
  recordEvents,
  resetDom,
  settle,
} from '@studiometa/js-toolkit/test';
import {
  Fetch,
  FETCH_EVENTS,
  type FetchEmits,
  type FetchLifecycleDetail,
} from '#private/Fetch/Fetch.js';
import { FetchShopifySection } from '#private/Fetch/FetchShopifySection.js';

registerComponents(Fetch, FetchShopifySection);

declare global {
  interface Window {
    __fetchScriptRuns?: number;
  }
}

const originalFetch = window.fetch;
const originalHref = window.location.href;

/** Real navigation would take the test runner with it. */
function preventNavigation(event: Event): void {
  event.preventDefault();
}

beforeEach(() => {
  document.addEventListener('click', preventNavigation, true);
  document.addEventListener('submit', preventNavigation, true);
});

afterEach(async () => {
  document.removeEventListener('click', preventNavigation, true);
  document.removeEventListener('submit', preventNavigation, true);
  window.fetch = originalFetch;
  window.history.replaceState({}, '', originalHref);
  delete window.__fetchScriptRuns;
  await resetDom();
});

/** Mount one `Fetch` (or subclass) from markup and hand back the instance. */
async function mountFetch<T extends Fetch = Fetch>(
  html: string,
  name = 'Fetch',
): Promise<{ root: HTMLElement; instance: T }> {
  const root = await mount(html);
  const el = root.firstElementChild as HTMLElement;
  return { root, instance: getInstance<T>(el, name)! };
}

/** Replace `window.fetch` and record every call. */
function stubClient(
  // An id no spec renders, so a request left in flight by one spec cannot
  // land in the next one's DOM.
  respond: (url: string, init: RequestInit) => Response | Promise<Response> = () =>
    new Response('<div id="fetch-default">new</div>'),
): ReturnType<typeof vi.fn> {
  const client = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) =>
    respond(String(input), init),
  );
  window.fetch = client as unknown as typeof fetch;
  return client;
}

/** The detail of the first recorded event of the given type. */
function detailOf(events: { type: string; detail: unknown }[], type: string): FetchLifecycleDetail {
  const event = events.find((candidate) => candidate.type === type);
  expect(event).toBeDefined();
  return event!.detail as FetchLifecycleDetail;
}

/**
 * Read a dotted path off a value, the way a declarative consumer resolves
 * `$event.detail.response.headers.x-search-result-count` with no knowledge of
 * `Fetch`.
 */
function resolvePath(source: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], source);
}

/** Take over both history writers and record which one an update reaches for. */
function stubHistory(): {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  restore: () => void;
} {
  const originalPush = window.history.pushState.bind(window.history);
  const originalReplace = window.history.replaceState.bind(window.history);
  const push = vi.fn(originalPush);
  const replace = vi.fn(originalReplace);
  window.history.pushState = push as typeof window.history.pushState;
  window.history.replaceState = replace as typeof window.history.replaceState;
  return {
    push,
    replace,
    restore() {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    },
  };
}

/** Take over `document.startViewTransition` and count the calls. */
function stubViewTransition(): { spy: ReturnType<typeof vi.fn>; restore: () => void } {
  const original = document.startViewTransition;
  const spy = vi.fn((callback: () => void | Promise<void>) => {
    const finished = Promise.resolve(callback()).then(() => undefined);
    return { ready: finished, finished, updateCallbackDone: finished, skipTransition() {} };
  });
  Object.defineProperty(document, 'startViewTransition', { value: spy, configurable: true });
  return {
    spy,
    restore() {
      if (original) {
        Object.defineProperty(document, 'startViewTransition', {
          value: original,
          configurable: true,
        });
      } else {
        delete (document as { startViewTransition?: unknown }).startViewTransition;
      }
    },
  };
}

describe('Fetch — headers across every HeadersInit form', () => {
  it('forwards a caller Headers instance instead of dropping it', async () => {
    const client = stubClient();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/page"><div id="fetch-h">old</div></a>`,
    );

    // Spreading a `Headers` yields no keys, so a spread would reach `fetch()`
    // with an empty header set.
    await instance.fetch(instance.url, { headers: new Headers({ 'x-custom': '1' }) });
    await settle();

    const [, init] = client.mock.calls[0] as [unknown, RequestInit];
    expect((init.headers as Record<string, string>)['x-custom']).toBe('1');
  });

  it('forwards a caller tuple array too, with the per-call value winning', async () => {
    const client = stubClient();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-headers='{"x-custom": "element"}'><div id="fetch-h">old</div></a>`,
    );

    await instance.fetch(instance.url, { headers: [['X-Custom', 'call']] });
    await settle();

    const [, init] = client.mock.calls[0] as [unknown, RequestInit];
    expect((init.headers as Record<string, string>)['x-custom']).toBe('call');
  });
});

describe('Fetch — request resolution', () => {
  it('reads the url of a link', async () => {
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="https://example.com/test"></a>`,
    );
    expect(instance.url.href).toBe('https://example.com/test');
  });

  it('reads the action of a form', async () => {
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/submit" method="post"></form>`,
    );
    expect(instance.url.href).toBe('https://example.com/submit');
  });

  it('folds the fields of a GET form onto the url', async () => {
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/submit" method="get">
        <input name="foo" value="bar">
      </form>`,
    );
    expect(instance.url.href).toBe('https://example.com/submit?foo=bar');
  });

  it('falls back to the `src` option on an element that is neither', async () => {
    const { instance } = await mountFetch(
      `<div data-component="Fetch" data-option-src="/src-path"></div>`,
    );
    expect(instance.url.pathname).toBe('/src-path');
  });

  it('lets the `src` option win over a link href', async () => {
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="https://example.com/href" data-option-src="https://example.com/src"></a>`,
    );
    expect(instance.url.href).toBe('https://example.com/src');
  });

  it('keeps a fixed query in `src` alongside the live GET form fields', async () => {
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/action" method="get"
        data-option-src="https://example.com/base?section_id=header">
        <input name="foo" value="bar">
      </form>`,
    );
    expect(instance.url.searchParams.get('section_id')).toBe('header');
    expect(instance.url.searchParams.get('foo')).toBe('bar');
  });

  it('lets a GET form field win over a conflicting `src` query', async () => {
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/action" method="get"
        data-option-src="https://example.com/base?foo=from-src">
        <input name="foo" value="from-form">
      </form>`,
    );
    expect(instance.url.searchParams.get('foo')).toBe('from-form');
  });

  it('keeps every value of a repeated GET form field', async () => {
    // A checkbox group is repeated names by design. Setting each field on top
    // of the last leaves one value, so ticking a second box changes nothing.
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get">
        <input type="checkbox" name="genre[]" value="rock" checked>
        <input type="checkbox" name="genre[]" value="jazz" checked>
      </form>`,
    );
    expect(instance.url.searchParams.getAll('genre[]')).toEqual(['rock', 'jazz']);
  });

  it('keeps every value of a repeated field that has no brackets', async () => {
    // The bracket suffix is a PHP convention, not an HTML one: a repeated name
    // is repeated whether or not it ends in `[]`, so the fold cannot key on
    // its shape.
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get">
        <input name="genre" value="rock">
        <input name="genre" value="jazz">
      </form>`,
    );
    expect(instance.url.searchParams.getAll('genre')).toEqual(['rock', 'jazz']);
  });

  it('keeps every selected option of a `select multiple`', async () => {
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get">
        <select name="genre" multiple>
          <option value="rock" selected>Rock</option>
          <option value="jazz" selected>Jazz</option>
          <option value="folk">Folk</option>
        </select>
      </form>`,
    );
    expect(instance.url.searchParams.getAll('genre')).toEqual(['rock', 'jazz']);
  });

  it('lets repeated GET form fields replace a conflicting query in `src`', async () => {
    // Both halves at once: the base's stale value goes, and both live values stay.
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get"
        data-option-src="/search/suggest?genre[]=stale&amp;section=keep">
        <input type="checkbox" name="genre[]" value="rock" checked>
        <input type="checkbox" name="genre[]" value="jazz" checked>
      </form>`,
    );
    expect(instance.url.searchParams.getAll('genre[]')).toEqual(['rock', 'jazz']);
    expect(instance.url.searchParams.get('section')).toBe('keep');
  });

  it('resolves `historyUrl` from the link href rather than the `src`', async () => {
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="https://example.com/projects/page/2?orderby=title"
        data-option-src="/projects/page/2?orderby=title&amp;sections=listing"></a>`,
    );
    expect(instance.url.searchParams.get('sections')).toBe('listing');
    expect(instance.historyUrl.href).toBe('https://example.com/projects/page/2?orderby=title');
  });

  it('folds the GET form data onto the action for `historyUrl`', async () => {
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get"
        data-option-src="/search/suggest?sections=results">
        <input name="q" value="live">
      </form>`,
    );
    // The address bar has to show what the no-JS submit would have produced,
    // filters included — the bare action would drop them.
    expect(instance.historyUrl.href).toBe('https://example.com/search?q=live');
    expect(instance.url.searchParams.get('sections')).toBe('results');
  });

  it('resolves `historyUrl` to the request url when there is no `src`', async () => {
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/submit" method="get">
        <input name="foo" value="bar">
      </form>`,
    );
    expect(instance.historyUrl.href).toBe(instance.url.href);
  });

  it('merges the `headers` option, the `requestInit` option and the header refs', async () => {
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="https://example.com"
        data-option-request-init='{"headers":{"x-from-init":"init"},"credentials":"include"}'
        data-option-headers='{"x-from-headers":"headers"}'>
        <input type="hidden" data-ref="headers[]" data-name="x-from-ref" value="ref">
        <input type="hidden" data-ref="headers[]" data-name="x-empty" value="">
      </a>`,
    );

    const headers = instance.requestInit.headers as Record<string, string>;
    expect(headers['x-from-init']).toBe('init');
    expect(headers['x-from-headers']).toBe('headers');
    expect(headers['x-from-ref']).toBe('ref');
    expect(headers['x-empty']).toBeUndefined();
    expect(headers['user-agent']).toContain('@studiometa/ui/Fetch');
    expect(instance.requestInit.credentials).toBe('include');
  });

  it('sends the form data as the body of a POST form', async () => {
    // A form that declares no `enctype` posts `application/x-www-form-urlencoded`,
    // which is what a native submission sends.
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com" method="post">
        <input name="foo" value="bar">
      </form>`,
    );
    expect(instance.requestInit.method).toBe('post');
    expect(instance.requestInit.body).toBeInstanceOf(URLSearchParams);
    expect(String(instance.requestInit.body)).toBe('foo=bar');
  });

  it('sends `FormData` when the form declares `multipart/form-data`', async () => {
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com" method="post"
        enctype="multipart/form-data">
        <input name="foo" value="bar">
      </form>`,
    );
    expect(instance.requestInit.body).toBeInstanceOf(FormData);
  });

  it('sends a plain text body when the form declares `text/plain`', async () => {
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com" method="post" enctype="text/plain">
        <input name="foo" value="bar">
        <input name="baz" value="qux">
      </form>`,
    );
    expect(instance.requestInit.body).toBe('foo=bar\r\nbaz=qux\r\n');
  });

  it('sends no body for a GET form', async () => {
    const { instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com" method="get">
        <input name="foo" value="bar">
      </form>`,
    );
    expect(instance.requestInit.method).toBe('get');
    expect(instance.requestInit.body).toBeUndefined();
  });

  it('answers `isLink` and `isForm` from the element itself', async () => {
    const { instance: link } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);
    const { instance: form } = await mountFetch(`<form data-component="Fetch"></form>`);
    const { instance: div } = await mountFetch(`<div data-component="Fetch"></div>`);

    expect([link.isLink, link.isForm]).toEqual([true, false]);
    expect([form.isLink, form.isForm]).toEqual([false, true]);
    expect([div.isLink, div.isForm]).toEqual([false, false]);
  });
});

describe('Fetch — declarative triggers', () => {
  it('fetches on a plain left click of a link', async () => {
    const client = stubClient();
    const { root } = await mountFetch(`<a data-component="Fetch" href="#target"></a>`);

    root.querySelector('a')?.click();
    await settle();

    expect(client).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['ctrlKey', { ctrlKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
    ['metaKey', { metaKey: true }],
    ['a secondary button', { button: 1 }],
  ])('does not fetch on a click with %s', async (_label, init) => {
    const client = stubClient();
    const { root } = await mountFetch(`<a data-component="Fetch" href="#target"></a>`);

    root
      .querySelector('a')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
    await settle();

    expect(client).not.toHaveBeenCalled();
  });

  it('does not fetch on a link that opens a new tab', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<a data-component="Fetch" href="#target" target="_blank"></a>`,
    );

    root.querySelector('a')?.click();
    await settle();

    expect(client).not.toHaveBeenCalled();
  });

  it('does nothing on a click when the element is not a link', async () => {
    const client = stubClient();
    const { root } = await mountFetch(`<div data-component="Fetch"></div>`);

    root.querySelector('div')?.click();
    await settle();

    expect(client).not.toHaveBeenCalled();
  });

  it('fetches on a form submission', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="#target" method="get"></form>`,
    );

    root.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
    await settle();

    expect(client).toHaveBeenCalledTimes(1);
  });

  it('does not fetch on a form that targets a new tab', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="#target" method="get" target="_blank"></form>`,
    );

    root.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
    await settle();

    expect(client).not.toHaveBeenCalled();
  });

  /**
   * `onWindowPopstate` is gap 15 consumed: `popstate` only ever fires on
   * `window`, so no amount of delegation reaches it.
   */
  it('fetches the current location on popstate when history is enabled', async () => {
    const client = stubClient();
    await mountFetch(`<a data-component="Fetch" href="#target" data-option-history></a>`);

    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle();

    expect(client).toHaveBeenCalledTimes(1);
    const [, init] = client.mock.calls[0] as [URL, RequestInit];
    expect((init.headers as Record<string, string>)['x-triggered-by']).toBe('popstate');
  });

  it('ignores popstate when history is disabled', async () => {
    const client = stubClient();
    await mountFetch(`<a data-component="Fetch" href="#target"></a>`);

    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle();

    expect(client).not.toHaveBeenCalled();
  });

  it('stops listening to popstate once the element leaves the DOM', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<a data-component="Fetch" href="#target" data-option-history></a>`,
    );

    root.remove();
    await settle();
    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle();

    expect(client).not.toHaveBeenCalled();
  });
});

describe('Fetch — native submitter semantics', () => {
  /** The submit button of the mounted form, and the form it belongs to. */
  function submit(root: HTMLElement, selector = 'button'): void {
    const form = root.querySelector('form') as HTMLFormElement;
    form.requestSubmit(form.querySelector<HTMLButtonElement>(selector));
  }

  it('makes the clicked submit button a successful control', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get">
        <input name="q" value="hello">
        <button type="submit" name="page" value="2">Next</button>
      </form>`,
    );

    submit(root);
    await settle();

    expect(String(client.mock.calls[0][0])).toBe('https://example.com/search?q=hello&page=2');
  });

  it('lets each submit button choose its own value', async () => {
    // Declarative pagination is two buttons of the same name over one form.
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get">
        <button type="submit" name="page" value="2">2</button>
        <button type="submit" name="page" value="3">3</button>
      </form>`,
    );

    submit(root, '[value="2"]');
    await settle();
    submit(root, '[value="3"]');
    await settle();

    expect(new URL(String(client.mock.calls[0][0])).searchParams.get('page')).toBe('2');
    expect(new URL(String(client.mock.calls[1][0])).searchParams.get('page')).toBe('3');
  });

  it('stays valid when a submission has no submitter', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get">
        <input name="q" value="hello">
        <button type="submit" name="page" value="2">Next</button>
      </form>`,
    );

    (root.querySelector('form') as HTMLFormElement).requestSubmit();
    await settle();

    // No submitter, so the button is not a successful control — as natively.
    expect(String(client.mock.calls[0][0])).toBe('https://example.com/search?q=hello');
  });

  it('honours `formaction`, on the request and on the pushed url alike', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get"
        data-option-history>
        <input name="q" value="hello">
        <button type="submit" formaction="/elsewhere">Elsewhere</button>
      </form>`,
    );

    submit(root);
    await settle();

    expect(String(client.mock.calls[0][0])).toBe(
      new URL('/elsewhere?q=hello', window.location.href).href,
    );
    expect(window.location.pathname).toBe('/elsewhere');
    expect(window.location.search).toBe('?q=hello');
  });

  it('honours `formmethod` when it turns a GET form into a POST', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get">
        <input name="q" value="hello">
        <button type="submit" formmethod="post" name="page" value="2">Next</button>
      </form>`,
    );

    submit(root);
    await settle();

    const [url, init] = client.mock.calls[0] as [URL, RequestInit];
    expect(init.method).toBe('post');
    // The fields travel in the body, so the url keeps none of them.
    expect(String(url)).toBe('https://example.com/search');
    expect(String(init.body)).toBe('q=hello&page=2');
  });

  it('honours `formmethod` when it turns a POST form into a GET', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="post">
        <input name="q" value="hello">
        <button type="submit" formmethod="get" name="page" value="2">Next</button>
      </form>`,
    );

    submit(root);
    await settle();

    const [url, init] = client.mock.calls[0] as [URL, RequestInit];
    expect(init.method).toBe('get');
    expect(init.body).toBeUndefined();
    expect(String(url)).toBe('https://example.com/search?q=hello&page=2');
  });

  it('honours `formenctype`', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/upload" method="post">
        <input name="foo" value="bar">
        <button type="submit" formenctype="multipart/form-data">Upload</button>
      </form>`,
    );

    submit(root);
    await settle();

    const [, init] = client.mock.calls[0] as [URL, RequestInit];
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('keeps repeated names alongside the submitter on a GET form', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get">
        <input type="checkbox" name="genre" value="rock" checked>
        <input type="checkbox" name="genre" value="jazz" checked>
        <button type="submit" name="page" value="2">Next</button>
      </form>`,
    );

    submit(root);
    await settle();

    const { searchParams } = new URL(String(client.mock.calls[0][0]));
    expect(searchParams.getAll('genre')).toEqual(['rock', 'jazz']);
    expect(searchParams.get('page')).toBe('2');
  });

  it('keeps repeated names alongside the submitter in a POST body', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="post">
        <input type="checkbox" name="genre" value="rock" checked>
        <input type="checkbox" name="genre" value="jazz" checked>
        <button type="submit" name="page" value="2">Next</button>
      </form>`,
    );

    submit(root);
    await settle();

    const [, init] = client.mock.calls[0] as [URL, RequestInit];
    const body = new URLSearchParams(String(init.body));
    expect(body.getAll('genre')).toEqual(['rock', 'jazz']);
    expect(body.get('page')).toBe('2');
  });

  it('does not carry a submitter into a later programmatic `fetch()`', async () => {
    // The submitter belongs to one submission. Kept on the instance it would
    // keep adding `page=2` to every request that follows.
    const client = stubClient();
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get">
        <input name="q" value="hello">
        <button type="submit" name="page" value="2">Next</button>
      </form>`,
    );

    submit(root);
    await settle();
    await instance.fetch();
    await settle();

    expect(new URL(String(client.mock.calls[0][0])).searchParams.get('page')).toBe('2');
    expect(new URL(String(client.mock.calls[1][0])).searchParams.has('page')).toBe(false);
    expect(instance.url.searchParams.has('page')).toBe(false);
  });
});

describe('Fetch — file controls', () => {
  /** Put a real file in a file control, the way a file picker does. */
  function attachFile(root: HTMLElement, name = 'photo.png'): File {
    const input = root.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['pixels'], name, { type: 'image/png' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    return file;
  }

  it('sends a file control as its filename when the enctype is not multipart', async () => {
    // A native URL-encoded submission sends the file's name. Stringifying the
    // `File` instead would send the literal `[object File]`.
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/upload" method="post">
        <input type="file" name="photo">
      </form>`,
    );
    attachFile(root);

    const body = instance.requestInit.body as URLSearchParams;
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(body.get('photo')).toBe('photo.png');
  });

  it('reports the upload it cannot send', async () => {
    const diagnostics = captureDiagnostics();
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/upload" method="post">
        <input type="file" name="photo">
      </form>`,
    );
    attachFile(root);
    void instance.requestInit;

    expect(diagnostics.codes).toContain('fetch.file-not-uploaded');
    diagnostics.stop();
  });

  it('sends a file control as its filename in a `text/plain` body', async () => {
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/upload" method="post"
        enctype="text/plain">
        <input type="file" name="photo">
      </form>`,
    );
    attachFile(root);

    expect(instance.requestInit.body).toBe('photo=photo.png\r\n');
  });

  it('sends the file itself when the form declares `multipart/form-data`', async () => {
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/upload" method="post"
        enctype="multipart/form-data">
        <input type="file" name="photo">
      </form>`,
    );
    const file = attachFile(root);

    const body = instance.requestInit.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('photo')).toBeInstanceOf(File);
    expect((body.get('photo') as File).name).toBe(file.name);
  });

  it('says nothing about a form that sends its file', async () => {
    const diagnostics = captureDiagnostics();
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/upload" method="post"
        enctype="multipart/form-data">
        <input type="file" name="photo">
      </form>`,
    );
    attachFile(root);
    void instance.requestInit;

    expect(diagnostics.codes).not.toContain('fetch.file-not-uploaded');
    diagnostics.stop();
  });

  it('sends a file control as its filename on a GET form, and reports it', async () => {
    // No GET submission uploads a file, whatever the form declares.
    const diagnostics = captureDiagnostics();
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/upload" method="get">
        <input type="file" name="photo">
      </form>`,
    );
    attachFile(root);
    (root.querySelector('form') as HTMLFormElement).requestSubmit();
    await settle();

    const { searchParams } = new URL(String(client.mock.calls[0][0]));
    expect(searchParams.get('photo')).toBe('photo.png');
    expect(diagnostics.codes).toContain('fetch.file-not-uploaded');
    diagnostics.stop();
  });

  it('sends the file when a submitter declares `formenctype="multipart/form-data"`', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/upload" method="post">
        <input type="file" name="photo">
        <button type="submit" formenctype="multipart/form-data">Upload</button>
      </form>`,
    );
    const file = attachFile(root);
    const form = root.querySelector('form') as HTMLFormElement;
    form.requestSubmit(form.querySelector('button'));
    await settle();

    const [, init] = client.mock.calls[0] as [URL, RequestInit];
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('photo')).toBeInstanceOf(File);
    expect(((init.body as FormData).get('photo') as File).name).toBe(file.name);
  });
});

describe('Fetch — the request', () => {
  it('defaults to the `url` getter when called bare', async () => {
    const client = stubClient();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="https://example.com/bare"></a>`,
    );

    await instance.fetch();

    expect(String(client.mock.calls[0][0])).toBe('https://example.com/bare');
  });

  it('coerces a string url against the current location', async () => {
    const client = stubClient();
    const { instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);

    await instance.fetch('/relative');

    expect(String(client.mock.calls[0][0])).toBe(new URL('/relative', window.location.href).href);
  });

  it('emits the whole lifecycle in order', async () => {
    stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();
    await settle();

    expect(events.map(({ type }) => type)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.FETCH,
      FETCH_EVENTS.RESPONSE,
      FETCH_EVENTS.AFTER_FETCH,
      FETCH_EVENTS.BEFORE_UPDATE,
      FETCH_EVENTS.UPDATE,
      FETCH_EVENTS.AFTER_UPDATE,
    ]);
  });

  /** `$emit()` already bubbles, so the component carries no `$emit` override. */
  it('bubbles its events to an ancestor with no `$emit` override', async () => {
    stubClient();
    const { instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);
    const seen: string[] = [];
    document.addEventListener(FETCH_EVENTS.RESPONSE, () => seen.push('document'));

    await instance.fetch();

    expect(seen).toEqual(['document']);
  });

  it('carries a typed payload on its events', async () => {
    stubClient();
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);
    let detail: FetchEmits['fetch-response'] | undefined;
    root.addEventListener(FETCH_EVENTS.RESPONSE, (event) => {
      detail = (event as CustomEvent<FetchEmits['fetch-response']>).detail;
    });

    await instance.fetch();

    expect(detail?.instance).toBe(instance);
    expect(detail?.request.url).toBe(instance.url.href);
    expect(detail?.response.status).toBe(200);
  });

  it('aborts the request in flight when a new one starts', async () => {
    let release: (() => void) | undefined;
    stubClient(
      async () =>
        new Promise<Response>((resolve) => {
          release = () => resolve(new Response('<div id="fetch-default">new</div>'));
        }),
    );
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    void instance.fetch();
    await settle();
    void instance.fetch();
    release?.();
    await settle();

    expect(events.filter(({ type }) => type === FETCH_EVENTS.ABORT)).toHaveLength(1);
  });

  it('emits `fetch-abort` when `abort()` is called', async () => {
    stubClient(async () => new Promise<Response>(() => {}));
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    void instance.fetch();
    instance.abort('because');
    await settle();

    const abort = events.find(({ type }) => type === FETCH_EVENTS.ABORT);
    expect((abort as { detail: { reason: unknown } }).detail.reason).toBe('because');
  });

  it('evaluates the `response` option to extract the content', async () => {
    stubClient(async () => new Response(JSON.stringify({ html: '<div id="target">json</div>' })));
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition
        data-option-response="response.json().then((data) => data.html)"></a>`,
    );

    await instance.fetch();
    await settle();

    expect(document.getElementById('target')?.textContent).toBe('json');
  });

  it('emits `fetch-error` when the response is not ok', async () => {
    stubClient(async () => new Response('nope', { status: 500 }));
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();

    const error = events.find(({ type }) => type === FETCH_EVENTS.ERROR);
    expect((error as { detail: { error: Error } }).detail.error.message).toContain('500');
  });

  it('emits `fetch-after` with the error and no content when the request fails', async () => {
    stubClient(async () => {
      throw new Error('network down');
    });
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();

    const after = events.find(({ type }) => type === FETCH_EVENTS.AFTER_FETCH);
    expect((after as { detail: { error: Error } }).detail.error.message).toBe('network down');
  });
});

describe('Fetch — the lifecycle detail', () => {
  it('describes the request as plain data, with no URL or RequestInit in the way', async () => {
    stubClient();
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get"
        data-option-no-view-transition>
        <input name="q" value="shoes">
      </form>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();
    await settle();

    expect(events.length).toBeGreaterThan(0);
    for (const { detail } of events as { detail: FetchLifecycleDetail }[]) {
      expect(detail.instance).toBe(instance);
      expect(detail.request).toEqual({
        url: 'https://example.com/search?q=shoes',
        method: 'GET',
        searchParams: { q: ['shoes'] },
      });
      expect(detail).not.toHaveProperty('url');
      expect(detail).not.toHaveProperty('requestInit');
    }
  });

  it('reports the method of a POST form uppercase', async () => {
    stubClient();
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/submit" method="post"
        data-option-no-view-transition></form>`,
    );
    const { events } = recordEvents(root, FETCH_EVENTS.BEFORE_FETCH);

    await instance.fetch();
    await settle();

    expect(detailOf(events, FETCH_EVENTS.BEFORE_FETCH).request.method).toBe('POST');
  });

  it('keeps every value of a repeated query parameter', async () => {
    // A checkbox group is repeated names by design, so one value per name
    // would describe a request the visitor never made.
    stubClient();
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get"
        data-option-no-view-transition>
        <input type="checkbox" name="genre" value="rock" checked>
        <input type="checkbox" name="genre" value="jazz" checked>
        <input name="q" value="shoes">
      </form>`,
    );
    const { events } = recordEvents(root, FETCH_EVENTS.BEFORE_FETCH);

    await instance.fetch();
    await settle();

    expect(detailOf(events, FETCH_EVENTS.BEFORE_FETCH).request.searchParams).toEqual({
      genre: ['rock', 'jazz'],
      q: ['shoes'],
    });
  });

  it('describes the response instead of handing out the `Response`', async () => {
    stubClient(
      async () =>
        new Response('<div id="fetch-default">new</div>', {
          status: 200,
          headers: { 'X-Search-Result-Count': '42' },
        }),
    );
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();
    await settle();

    const { response } = detailOf(events, FETCH_EVENTS.RESPONSE);
    expect(response).not.toBeInstanceOf(Response);
    expect(response?.headers).not.toBeInstanceOf(Headers);
    expect(response?.status).toBe(200);
    expect(response?.ok).toBe(true);
    expect(response?.redirected).toBe(false);
  });

  it('normalises the response header names to lowercase', async () => {
    stubClient(
      async () =>
        new Response('<div id="fetch-default">new</div>', {
          headers: { 'X-Search-Result-Count': '42' },
        }),
    );
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();
    await settle();

    expect(detailOf(events, FETCH_EVENTS.RESPONSE).response?.headers['x-search-result-count']).toBe(
      '42',
    );
  });

  it('keeps the response status and headers on the update events', async () => {
    stubClient(
      async () =>
        new Response('<div id="fetch-default">new</div>', {
          status: 200,
          headers: { 'X-Search-Result-Count': '42' },
        }),
    );
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();
    await settle();

    for (const type of [
      FETCH_EVENTS.BEFORE_UPDATE,
      FETCH_EVENTS.UPDATE,
      FETCH_EVENTS.AFTER_UPDATE,
    ]) {
      const detail = detailOf(events, type);
      expect(detail.response?.status).toBe(200);
      expect(detail.response?.headers['x-search-result-count']).toBe('42');
    }
  });

  it('adds the metadata as the lifecycle progresses', async () => {
    stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();
    await settle();

    function known(type: string) {
      const detail = detailOf(events, type);
      return {
        response: detail.response !== undefined,
        content: detail.content !== undefined,
        fragment: detail.fragment !== undefined,
      };
    }

    expect(known(FETCH_EVENTS.BEFORE_FETCH)).toEqual({
      response: false,
      content: false,
      fragment: false,
    });
    expect(known(FETCH_EVENTS.FETCH)).toEqual({
      response: false,
      content: false,
      fragment: false,
    });
    expect(known(FETCH_EVENTS.RESPONSE)).toEqual({
      response: true,
      content: false,
      fragment: false,
    });
    expect(known(FETCH_EVENTS.AFTER_FETCH)).toEqual({
      response: true,
      content: true,
      fragment: false,
    });
    expect(known(FETCH_EVENTS.BEFORE_UPDATE)).toEqual({
      response: true,
      content: true,
      fragment: false,
    });
    expect(known(FETCH_EVENTS.UPDATE)).toEqual({ response: true, content: true, fragment: true });
    expect(known(FETCH_EVENTS.AFTER_UPDATE)).toEqual({
      response: true,
      content: true,
      fragment: true,
    });
  });

  it('carries the content and the parsed fragment on the update events', async () => {
    stubClient(async () => new Response('<div id="fetch-default">new</div>'));
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();
    await settle();

    const detail = detailOf(events, FETCH_EVENTS.AFTER_UPDATE);
    expect(detail.content).toBe('<div id="fetch-default">new</div>');
    expect(detail.fragment?.getElementById('fetch-default')?.textContent).toBe('new');
  });

  it('resolves every field through a generic nested-path walk', async () => {
    // This is what a declarative consumer does with the detail: walk it by
    // path, knowing nothing about `Fetch`. A getter, a `Headers` or a `Map`
    // anywhere on the way would make the path resolve to `undefined`.
    stubClient(
      async () =>
        new Response('<div id="fetch-default">new</div>', {
          headers: { 'X-Search-Result-Count': '42' },
        }),
    );
    const { root, instance } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get"
        data-option-no-view-transition>
        <input type="checkbox" name="genre" value="rock" checked>
        <input type="checkbox" name="genre" value="jazz" checked>
      </form>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();
    await settle();

    const detail = detailOf(events, FETCH_EVENTS.AFTER_UPDATE);

    expect(resolvePath(detail, 'instance')).toBe(instance);
    expect(resolvePath(detail, 'request.url')).toBe(
      'https://example.com/search?genre=rock&genre=jazz',
    );
    expect(resolvePath(detail, 'request.method')).toBe('GET');
    expect(resolvePath(detail, 'request.searchParams.genre.0')).toBe('rock');
    expect(resolvePath(detail, 'request.searchParams.genre.1')).toBe('jazz');
    expect(resolvePath(detail, 'response.status')).toBe(200);
    expect(resolvePath(detail, 'response.ok')).toBe(true);
    expect(resolvePath(detail, 'response.headers.x-search-result-count')).toBe('42');
    expect(resolvePath(detail, 'content')).toBe('<div id="fetch-default">new</div>');
  });

  it('describes the response on the error of a failed request', async () => {
    stubClient(async () => new Response('nope', { status: 500, headers: { 'X-Reason': 'boom' } }));
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();

    for (const type of [FETCH_EVENTS.AFTER_FETCH, FETCH_EVENTS.ERROR]) {
      const detail = detailOf(events, type);
      expect(detail.response?.status).toBe(500);
      expect(detail.response?.headers['x-reason']).toBe('boom');
    }
  });

  it('leaves the response undefined when the request never returned one', async () => {
    stubClient(async () => {
      throw new Error('network down');
    });
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="/page" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();

    expect(detailOf(events, FETCH_EVENTS.ERROR).response).toBeUndefined();
  });

  it('carries the request on the abort event', async () => {
    stubClient(async () => new Promise<Response>(() => {}));
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="https://example.com/page"></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    void instance.fetch();
    instance.abort('because');
    await settle();

    expect(detailOf(events, FETCH_EVENTS.ABORT).request.url).toBe('https://example.com/page');
  });
});

describe('Fetch — awaiting the update', () => {
  it('has emitted the whole lifecycle by the time `fetch()` resolves', async () => {
    stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    // No `settle()`: the returned promise alone is the guarantee under test.
    await instance.fetch();

    expect(events.map(({ type }) => type)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.FETCH,
      FETCH_EVENTS.RESPONSE,
      FETCH_EVENTS.AFTER_FETCH,
      FETCH_EVENTS.BEFORE_UPDATE,
      FETCH_EVENTS.UPDATE,
      FETCH_EVENTS.AFTER_UPDATE,
    ]);
  });

  it('has applied the DOM update by the time `fetch()` resolves', async () => {
    await mount(`<div id="target">old</div>`);
    stubClient(async () => new Response('<div id="target">new</div>'));
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );

    await instance.fetch();

    expect(document.getElementById('target')?.textContent).toBe('new');
  });

  it('routes an update rejection through the error lifecycle', async () => {
    stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );
    const failure = new Error('swap failed');
    instance.updateDOM = () => Promise.reject(failure);
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();

    const detail = detailOf(events, FETCH_EVENTS.ERROR) as FetchLifecycleDetail & {
      error?: unknown;
    };
    expect(detail.instance).toBe(instance);
    expect(detail.error).toBe(failure);
  });

  it('does not announce the fetch phase twice when the update fails', async () => {
    stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );
    instance.updateDOM = () => Promise.reject(new Error('swap failed'));
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();

    expect(events.map(({ type }) => type)).toEqual([
      FETCH_EVENTS.BEFORE_FETCH,
      FETCH_EVENTS.FETCH,
      FETCH_EVENTS.RESPONSE,
      FETCH_EVENTS.AFTER_FETCH,
      FETCH_EVENTS.BEFORE_UPDATE,
      FETCH_EVENTS.UPDATE,
      FETCH_EVENTS.ERROR,
    ]);
  });

  it('carries the content and the fragment in flight on the error of a failed update', async () => {
    // The failed update is the one case where a consumer most needs to see
    // what was being applied, so nothing learned before it is dropped.
    stubClient(async () => new Response('<div id="fetch-default">new</div>'));
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );
    instance.updateDOM = () => Promise.reject(new Error('swap failed'));
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();

    const detail = detailOf(events, FETCH_EVENTS.ERROR);
    expect(detail.content).toBe('<div id="fetch-default">new</div>');
    expect(detail.fragment?.getElementById('fetch-default')?.textContent).toBe('new');
  });

  it('carries no content or fragment on the error of a failed request', async () => {
    stubClient(async () => new Response('nope', { status: 500 }));
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();

    const detail = detailOf(events, FETCH_EVENTS.ERROR);
    expect(detail.content).toBeUndefined();
    expect(detail.fragment).toBeUndefined();
    expect(detail.response?.status).toBe(500);
  });

  it('does not add a later field to the detail of an earlier event', async () => {
    // The accumulation is progressive, so each event is given a copy of it:
    // the detail of `fetch-before` describes the point it fired at, whatever
    // the lifecycle learns afterwards.
    stubClient();
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();

    const before = detailOf(events, FETCH_EVENTS.BEFORE_FETCH);
    const afterUpdate = detailOf(events, FETCH_EVENTS.AFTER_UPDATE);
    expect(before).not.toBe(afterUpdate);
    expect(before.content).toBeUndefined();
    expect(before.fragment).toBeUndefined();
    expect(afterUpdate.content).toBeDefined();
  });

  it('describes the response on the error of a failed update', async () => {
    stubClient(
      async () =>
        new Response('<div id="fetch-default">new</div>', {
          headers: { 'X-Search-Result-Count': '42' },
        }),
    );
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );
    instance.updateDOM = () => Promise.reject(new Error('swap failed'));
    const { events } = recordEvents(root, ...Object.values(FETCH_EVENTS));

    await instance.fetch();

    expect(detailOf(events, FETCH_EVENTS.ERROR).response?.headers['x-search-result-count']).toBe(
      '42',
    );
  });
});

describe('Fetch — the DOM update', () => {
  it('replaces the matching element and leaves the rest alone', async () => {
    await mount(`<div id="target">old</div><div id="untouched">keep</div>`);
    const { instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);

    await instance.update(
      new URL('https://example.com'),
      {},
      '<div id="target">new</div><div id="absent">nope</div>',
    );

    expect(document.getElementById('target')?.textContent).toBe('new');
    expect(document.getElementById('untouched')?.textContent).toBe('keep');
    expect(document.getElementById('absent')).toBeNull();
  });

  it('honours the `selector` option', async () => {
    await mount(`<div id="target">old</div><section id="section">old</section>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-selector="section[id]"></a>`,
    );

    await instance.update(
      new URL('https://example.com'),
      {},
      '<div id="target">new</div><section id="section">new</section>',
    );

    expect(document.getElementById('target')?.textContent).toBe('old');
    expect(document.getElementById('section')?.textContent).toBe('new');
  });

  it('appends in `append` mode', async () => {
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-mode="append"></a>`,
    );

    await instance.update(new URL('https://example.com'), {}, '<div id="target">new</div>');

    expect(document.getElementById('target')?.textContent).toBe('oldnew');
  });

  it('prepends in `prepend` mode', async () => {
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-mode="prepend"></a>`,
    );

    await instance.update(new URL('https://example.com'), {}, '<div id="target">new</div>');

    expect(document.getElementById('target')?.textContent).toBe('newold');
  });

  /**
   * `morph` keeps the node and updates its attributes. Core's `swap()` morphs
   * with `childrenOnly`, which is why this port keeps its own update path.
   */
  it('keeps the node and updates its attributes in `morph` mode', async () => {
    await mount(`<div id="target" class="old">old</div>`);
    const before = document.getElementById('target');
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-mode="morph"></a>`,
    );

    await instance.update(
      new URL('https://example.com'),
      {},
      '<div id="target" class="new">new</div>',
    );

    expect(document.getElementById('target')).toBe(before);
    expect(before?.className).toBe('new');
    expect(before?.textContent).toBe('new');
  });

  it('replaces the element itself in `replace` mode, attributes included', async () => {
    await mount(`<div id="target" class="old">old</div>`);
    const before = document.getElementById('target');
    const { instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);

    await instance.update(
      new URL('https://example.com'),
      {},
      '<div id="target" class="new">new</div>',
    );

    expect(document.getElementById('target')).not.toBe(before);
    expect(document.getElementById('target')?.className).toBe('new');
  });

  it('runs an injected script exactly once and leaves the surviving ones alone', async () => {
    window.__fetchScriptRuns = 0;
    await mount(
      `<div id="target"><script id="kept">window.__fetchScriptRuns = (window.__fetchScriptRuns ?? 0) + 1;</script></div>`,
    );
    const runsAfterInitialParse = window.__fetchScriptRuns;
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-mode="append"></a>`,
    );

    await instance.update(
      new URL('https://example.com'),
      {},
      '<div id="target"><script>window.__fetchScriptRuns = (window.__fetchScriptRuns ?? 0) + 1;</scr' +
        'ipt></div>',
    );

    expect(window.__fetchScriptRuns).toBe((runsAfterInitialParse ?? 0) + 1);
  });

  it('pushes history and adopts the response title when `history` is enabled', async () => {
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-history></a>`,
    );

    await instance.update(
      new URL('https://example.com/pushed?q=1'),
      {},
      '<html><head><title>New title</title></head><body><div id="target">new</div></body></html>',
    );
    await settle();

    expect(window.location.pathname).toBe('/pushed');
    expect(window.location.search).toBe('?q=1');
    expect(document.title).toBe('New title');
  });

  it('does not push history for an update triggered by popstate', async () => {
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-history></a>`,
    );
    const before = window.location.href;

    await instance.update(
      new URL('https://example.com/never-pushed'),
      { headers: { 'x-triggered-by': 'popstate' } },
      '<div id="target">new</div>',
    );

    expect(window.location.href).toBe(before);
  });

  it('pushes the element destination rather than the fetched `src`', async () => {
    const client = stubClient();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="https://example.com/projects/page/2?orderby=title"
        data-option-src="/projects/page/2?orderby=title&amp;sections=listing"
        data-option-history></a>`,
    );

    await instance.fetch();
    await settle();

    // Requested the lighter endpoint…
    expect(String(client.mock.calls[0][0])).toBe(
      new URL('/projects/page/2?orderby=title&sections=listing', window.location.href).href,
    );
    // …and left a URL somebody can copy.
    expect(window.location.pathname).toBe('/projects/page/2');
    expect(window.location.search).toBe('?orderby=title');
  });

  it('pushes the destination when a link is clicked, not only on a bare `fetch()`', async () => {
    // The declarative path is the one people use, and it is the one a `fetch()`
    // spec alone leaves uncovered: an `onClick` passing `this.url` on reads as a
    // caller naming a destination and puts the `src` back in the address bar.
    const client = stubClient();
    const { root } = await mountFetch(
      `<a data-component="Fetch" href="https://example.com/projects/page/2?orderby=title"
        data-option-src="/projects/page/2?orderby=title&amp;sections=listing"
        data-option-history></a>`,
    );

    root.querySelector('a')?.click();
    await settle();

    expect(String(client.mock.calls[0][0])).toBe(
      new URL('/projects/page/2?orderby=title&sections=listing', window.location.href).href,
    );
    expect(window.location.pathname).toBe('/projects/page/2');
    expect(window.location.search).toBe('?orderby=title');
  });

  it('pushes the destination when a GET form is submitted', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="https://example.com/search" method="get"
        data-option-src="/search/suggest?sections=results" data-option-history>
        <input name="q" value="live">
      </form>`,
    );

    root.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
    await settle();

    expect(String(client.mock.calls[0][0])).toContain('sections=results');
    expect(window.location.pathname).toBe('/search');
    expect(window.location.search).toBe('?q=live');
  });

  it('pushes a url given to `fetch()` rather than the element destination', async () => {
    stubClient();
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="https://example.com/from-href" data-option-history></a>`,
    );

    // A caller that named a URL meant that URL, in the address bar as well.
    await instance.fetch('/called-explicitly');
    await settle();

    expect(window.location.pathname).toBe('/called-explicitly');
  });

  it('mounts a component that arrives in the fetched content, with no `$update()`', async () => {
    await mount(`<div id="target"></div>`);
    const { instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);

    await instance.update(
      new URL('https://example.com'),
      {},
      '<div id="target"><a data-component="Fetch" href="https://example.com/inner"></a></div>',
    );
    await settle();

    const injected = document.querySelector('#target [data-component="Fetch"]');
    expect(getInstance<Fetch>(injected as HTMLElement, 'Fetch')?.$isMounted).toBe(true);
  });
});

describe('Fetch — history mode', () => {
  it('pushes one entry per update by default', async () => {
    const history = stubHistory();
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-history data-option-no-view-transition></a>`,
    );

    await instance.update(new URL('https://example.com/one'), {}, '<div id="target">1</div>');
    await instance.update(new URL('https://example.com/two'), {}, '<div id="target">2</div>');

    expect(instance.$options.historyMode).toBe('push');
    expect(history.push).toHaveBeenCalledTimes(2);
    expect(history.replace).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe('/two');
    history.restore();
  });

  it('adds no entry per update in `replace` mode', async () => {
    // One keystroke of a live search must not cost one back press.
    const history = stubHistory();
    const entriesBefore = window.history.length;
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-history data-option-history-mode="replace"
        data-option-no-view-transition></a>`,
    );

    await instance.update(new URL('https://example.com/one'), {}, '<div id="target">1</div>');
    await instance.update(new URL('https://example.com/two'), {}, '<div id="target">2</div>');

    expect(history.push).not.toHaveBeenCalled();
    expect(history.replace).toHaveBeenCalledTimes(2);
    expect(window.history.length).toBe(entriesBefore);
    expect(window.location.pathname).toBe('/two');
    history.restore();
  });

  it('writes nothing when `history` is off, whatever the mode', async () => {
    const history = stubHistory();
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-history-mode="replace"
        data-option-no-view-transition></a>`,
    );

    await instance.update(new URL('https://example.com/one'), {}, '<div id="target">1</div>');

    expect(history.push).not.toHaveBeenCalled();
    expect(history.replace).not.toHaveBeenCalled();
    history.restore();
  });

  it('replaces the entry with the destination url, not the fetched `src`', async () => {
    const client = stubClient();
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/help" method="get"
        data-option-src="/apps/search?view=fragment"
        data-option-history data-option-history-mode="replace">
        <input name="q" value="shipping">
      </form>`,
    );

    (root.querySelector('form') as HTMLFormElement).requestSubmit();
    await settle();

    const requested = new URL(String(client.mock.calls[0][0]));
    expect(requested.pathname).toBe('/apps/search');
    expect(requested.searchParams.get('view')).toBe('fragment');
    expect(requested.searchParams.get('q')).toBe('shipping');
    expect(window.location.pathname).toBe('/help');
    expect(window.location.search).toBe('?q=shipping');
  });
});

describe('Fetch — popstate with a separate source', () => {
  it('fetches the restored location when there is no `src`', async () => {
    // The element's own `href` is where it pointed when the page was
    // rendered, not where the visitor just went back to.
    const client = stubClient();
    await mountFetch(`<a data-component="Fetch" href="/elsewhere" data-option-history></a>`);
    window.history.replaceState({}, '', '/restored?page=3');

    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle();

    const requested = new URL(String(client.mock.calls[0][0]));
    expect(requested.pathname).toBe('/restored');
    expect(requested.searchParams.get('page')).toBe('3');
  });

  it('rebuilds the source request, keeping its fixed parameters', async () => {
    const client = stubClient();
    window.history.replaceState({}, '', '/help?q=shipping');
    await mountFetch(
      `<form data-component="Fetch" action="/help" method="get"
        data-option-src="/apps/search?view=fragment"
        data-option-history data-option-history-mode="replace">
        <input name="q" value="shipping">
      </form>`,
    );

    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle();

    const requested = new URL(String(client.mock.calls[0][0]));
    expect(requested.pathname).toBe('/apps/search');
    expect(requested.searchParams.get('view')).toBe('fragment');
    expect(requested.searchParams.get('q')).toBe('shipping');
  });

  it('lets the restored state win over the live controls', async () => {
    // The field still holds what the visitor last typed, which is stale
    // relative to the entry being restored.
    const client = stubClient();
    window.history.replaceState({}, '', '/help?q=returns');
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/help" method="get"
        data-option-src="/apps/search?view=fragment" data-option-history>
        <input name="q" value="shipping">
      </form>`,
    );
    expect(root.querySelector('input')?.value).toBe('shipping');

    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle();

    expect(new URL(String(client.mock.calls[0][0])).searchParams.get('q')).toBe('returns');
  });

  it('does not replay a previous submitter on popstate', async () => {
    const client = stubClient();
    window.history.replaceState({}, '', '/help?q=shipping');
    const { root } = await mountFetch(
      `<form data-component="Fetch" action="/help" method="get"
        data-option-src="/apps/search?view=fragment" data-option-history>
        <input name="q" value="shipping">
        <button type="submit" name="page" value="2">Next</button>
      </form>`,
    );
    const form = root.querySelector('form') as HTMLFormElement;

    form.requestSubmit(form.querySelector('button'));
    await settle();
    // Go back to the entry that came before the submission.
    window.history.replaceState({}, '', '/help?q=shipping');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle();

    expect(new URL(String(client.mock.calls[0][0])).searchParams.get('page')).toBe('2');
    expect(new URL(String(client.mock.calls[1][0])).searchParams.has('page')).toBe(false);
  });

  it('writes no history entry on popstate', async () => {
    const client = stubClient();
    window.history.replaceState({}, '', '/help?q=shipping');
    await mountFetch(
      `<form data-component="Fetch" action="/help" method="get"
        data-option-src="/apps/search?view=fragment" data-option-history>
        <input name="q" value="shipping">
      </form>`,
    );
    const history = stubHistory();

    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle();

    expect(client).toHaveBeenCalledTimes(1);
    expect(history.push).not.toHaveBeenCalled();
    expect(history.replace).not.toHaveBeenCalled();
    history.restore();
  });
});

describe('Fetch — the dom-update negotiation', () => {
  it('runs the update inside a view transition by default', async () => {
    const { spy, restore } = stubViewTransition();
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);

    await instance.update(new URL('https://example.com'), {}, '<div id="target">new</div>');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(document.getElementById('target')?.textContent).toBe('new');
    restore();
  });

  it('skips the view transition when the option is off', async () => {
    const { spy, restore } = stubViewTransition();
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );

    await instance.update(new URL('https://example.com'), {}, '<div id="target">new</div>');

    expect(spy).not.toHaveBeenCalled();
    expect(document.getElementById('target')?.textContent).toBe('new');
    restore();
  });

  it('batches two simultaneous updates into one view transition', async () => {
    const { spy, restore } = stubViewTransition();
    await mount(`<div id="one">old</div><div id="two">old</div>`);
    const { instance: a } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);
    const { instance: b } = await mountFetch(`<a data-component="Fetch" href="#b"></a>`);

    await Promise.all([
      a.update(new URL('https://example.com'), {}, '<div id="one">new</div>'),
      b.update(new URL('https://example.com'), {}, '<div id="two">new</div>'),
    ]);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(document.getElementById('one')?.textContent).toBe('new');
    expect(document.getElementById('two')?.textContent).toBe('new');
    restore();
  });

  /**
   * The component's own view transition is registered as the first `wrap()`
   * claim, so a listener above it wins without the component asking.
   */
  it('lets an ancestor `wrap()` runner replace the default view transition', async () => {
    const { spy, restore } = stubViewTransition();
    await mount(`<div id="target">old</div>`);
    const { root, instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);
    const order: string[] = [];
    root.addEventListener('js-toolkit:dom:update', (event) => {
      (event as CustomEvent<{ wrap(runner: (apply: () => void) => void): void }>).detail.wrap(
        (apply) => {
          order.push('runner');
          apply();
        },
      );
    });

    await instance.update(new URL('https://example.com'), {}, '<div id="target">new</div>');

    expect(order).toEqual(['runner']);
    expect(spy).not.toHaveBeenCalled();
    expect(document.getElementById('target')?.textContent).toBe('new');
    restore();
  });

  it('accepts a transitioner object exposing `update()`', async () => {
    await mount(`<div id="target">old</div>`);
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );
    const transitioner = { update: vi.fn((mutate: () => void) => mutate()) };
    root.addEventListener('js-toolkit:dom:update', (event) => {
      (event as CustomEvent<{ wrap(runner: unknown): void }>).detail.wrap(transitioner);
    });

    await instance.update(new URL('https://example.com'), {}, '<div id="target">new</div>');

    expect(transitioner.update).toHaveBeenCalledTimes(1);
    expect(document.getElementById('target')?.textContent).toBe('new');
  });

  it('applies the change anyway when a runner settles without applying it', async () => {
    await mount(`<div id="target">old</div>`);
    const { root, instance } = await mountFetch(
      `<a data-component="Fetch" href="#a" data-option-no-view-transition></a>`,
    );
    root.addEventListener('js-toolkit:dom:update', (event) => {
      (event as CustomEvent<{ wrap(runner: () => void): void }>).detail.wrap(() => {});
    });

    await instance.update(new URL('https://example.com'), {}, '<div id="target">new</div>');

    expect(document.getElementById('target')?.textContent).toBe('new');
  });

  it('stops claiming the protocol once the update has finished', async () => {
    const { spy, restore } = stubViewTransition();
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch(`<a data-component="Fetch" href="#a"></a>`);

    await instance.update(new URL('https://example.com'), {}, '<div id="target">new</div>');
    const callsAfterUpdate = spy.mock.calls.length;

    // A second, unrelated announcement on the same element must not be claimed.
    let claimed = false;
    instance.$el.dispatchEvent(
      new CustomEvent('js-toolkit:dom:update', {
        bubbles: true,
        detail: {
          wrap() {
            claimed = true;
          },
        },
      }),
    );

    expect(claimed).toBe(false);
    expect(spy.mock.calls).toHaveLength(callsAfterUpdate);
    restore();
  });
});

describe('FetchShopifySection', () => {
  it('inherits the whole base config along the prototype chain', async () => {
    const { instance } = await mountFetch<FetchShopifySection>(
      `<a data-component="FetchShopifySection" href="#a"></a>`,
      'FetchShopifySection',
    );

    // The static declares only `name` and `sections`; the rest is merged.
    expect(Object.keys(FetchShopifySection.config.options ?? {})).toEqual(['sections']);
    expect(instance.$config.name).toBe('FetchShopifySection');
    expect(instance.$config.options).toHaveProperty('selector');
    expect(instance.$config.options).toHaveProperty('mode');
    expect(instance.$config.options).toHaveProperty('sections');
    expect(instance.$config.refs).toEqual(['headers[]']);
    expect(instance.$options.selector).toBe('[id]');
  });

  it('appends the sections parameter without touching the href', async () => {
    const { instance } = await mountFetch<FetchShopifySection>(
      `<a data-component="FetchShopifySection" href="https://example.com/collections/all"
        data-option-sections="header, footer"></a>`,
      'FetchShopifySection',
    );

    expect(instance.url.searchParams.get('sections')).toBe('header,footer');
    expect((instance.$el as HTMLAnchorElement).href).toBe('https://example.com/collections/all');
  });

  it('trims the comma-separated list and drops empty entries', async () => {
    const { instance } = await mountFetch<FetchShopifySection>(
      `<a data-component="FetchShopifySection" href="https://example.com"
        data-option-sections=" header , , footer "></a>`,
      'FetchShopifySection',
    );

    expect(instance.sectionIds).toEqual(['header', 'footer']);
  });

  it('unwraps the JSON response and swaps each section by id', async () => {
    stubClient(
      async () =>
        new Response(
          JSON.stringify({
            header: '<div id="header">new header</div>',
            footer: '<div id="footer">new footer</div>',
          }),
        ),
    );
    await mount(`<div id="header">old header</div><div id="footer">old footer</div>`);
    const { instance } = await mountFetch<FetchShopifySection>(
      `<a data-component="FetchShopifySection" href="#a" data-option-sections="header,footer"
        data-option-no-view-transition></a>`,
      'FetchShopifySection',
    );

    await instance.fetch();
    await settle();

    expect(document.getElementById('header')?.textContent).toBe('new header');
    expect(document.getElementById('footer')?.textContent).toBe('new footer');
  });

  it('drops sections returned as null', async () => {
    stubClient(
      async () =>
        new Response(JSON.stringify({ header: '<div id="header">new</div>', footer: null })),
    );
    await mount(`<div id="header">old</div><div id="footer">old</div>`);
    const { instance } = await mountFetch<FetchShopifySection>(
      `<a data-component="FetchShopifySection" href="#a" data-option-sections="header,footer"
        data-option-no-view-transition></a>`,
      'FetchShopifySection',
    );

    await instance.fetch();
    await settle();

    expect(document.getElementById('header')?.textContent).toBe('new');
    expect(document.getElementById('footer')?.textContent).toBe('old');
  });

  it('degrades to the base text response when no sections are configured', async () => {
    stubClient(async () => new Response('<div id="target">plain html</div>'));
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch<FetchShopifySection>(
      `<a data-component="FetchShopifySection" href="#a" data-option-no-view-transition></a>`,
      'FetchShopifySection',
    );

    await instance.fetch();
    await settle();

    expect(instance.url.searchParams.has('sections')).toBe(false);
    expect(document.getElementById('target')?.textContent).toBe('plain html');
  });

  it('honours a custom `response` option instead of unwrapping the JSON', async () => {
    stubClient(async () => new Response(JSON.stringify({ html: '<div id="target">custom</div>' })));
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch<FetchShopifySection>(
      `<a data-component="FetchShopifySection" href="#a" data-option-sections="header"
        data-option-no-view-transition
        data-option-response="response.json().then((data) => data.html)"></a>`,
      'FetchShopifySection',
    );

    await instance.fetch();
    await settle();

    expect(document.getElementById('target')?.textContent).toBe('custom');
  });

  it('re-appends the sections parameter on popstate', async () => {
    const client = stubClient(async () => new Response(JSON.stringify({})));
    await mountFetch<FetchShopifySection>(
      `<a data-component="FetchShopifySection" href="#a" data-option-sections="header"
        data-option-history></a>`,
      'FetchShopifySection',
    );

    window.dispatchEvent(new PopStateEvent('popstate'));
    await settle();

    expect(String(client.mock.calls[0][0])).toContain('sections=header');
  });

  it('keeps the sections parameter out of the pushed url', async () => {
    await mount(`<div id="target">old</div>`);
    const { instance } = await mountFetch<FetchShopifySection>(
      `<a data-component="FetchShopifySection" href="#a" data-option-sections="header"
        data-option-history></a>`,
      'FetchShopifySection',
    );

    await instance.update(
      new URL('https://example.com/pushed?sections=header&q=1'),
      {},
      '<div id="target">new</div>',
    );

    expect(window.location.search).toBe('?q=1');
  });

  it('pushes the destination on a click, neither the `src` nor the sections', async () => {
    // The `fetch()` override here supplies its own URL, which would read as a
    // caller naming a destination and take the element back out of the
    // `historyUrl` path the base opened.
    const client = stubClient(async () => new Response(JSON.stringify({})));
    const { root } = await mountFetch<FetchShopifySection>(
      `<a data-component="FetchShopifySection" href="/projects/page/2?orderby=title"
        data-option-src="/projects/page/2?orderby=title&amp;view=compact"
        data-option-sections="header" data-option-history></a>`,
      'FetchShopifySection',
    );

    root.querySelector('a')?.click();
    await settle();

    expect(String(client.mock.calls[0][0])).toContain('sections=header');
    expect(String(client.mock.calls[0][0])).toContain('view=compact');
    expect(window.location.pathname).toBe('/projects/page/2');
    expect(window.location.search).toBe('?orderby=title');
  });
});
