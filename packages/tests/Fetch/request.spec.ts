import { describe, expect, it } from 'vitest';
import {
  encodeBody,
  headerRecord,
  requestUrl,
  responseDetail,
  stringRecord,
  textEntries,
} from '#private/Fetch/request.js';

const origin = 'https://shop.example';

function url(path: string): URL {
  return new URL(path, origin);
}

describe('requestUrl — params', () => {
  it('adds `params` to the destination', () => {
    expect(
      requestUrl(url('/projects?page=2'), { params: { view: 'fragment' }, fold: true }).href,
    ).toBe(`${origin}/projects?page=2&view=fragment`);
  });

  it('rebuilds the same request from a restored destination', () => {
    expect(
      requestUrl(url('/projects?page=1'), { params: { view: 'fragment' }, fold: true }).href,
    ).toBe(`${origin}/projects?page=1&view=fragment`);
  });

  it('sets `params` last, so they win over the destination query', () => {
    expect(
      requestUrl(url('/p?view=full&a=1'), { params: { view: 'fragment' }, fold: true }).href,
    ).toBe(`${origin}/p?view=fragment&a=1`);
  });

  it('returns the destination itself with no `src` and no `params`', () => {
    expect(requestUrl(url('/p?a=1#top'), { fold: true }).href).toBe(`${origin}/p?a=1#top`);
  });
});

describe('requestUrl — src', () => {
  it('gives origin and path from `src`, keeps its query, and folds the destination query', () => {
    expect(
      requestUrl(url('/help?q=shoes'), { src: `${origin}/apps/search?view=fragment`, fold: true })
        .href,
    ).toBe(`${origin}/apps/search?view=fragment&q=shoes`);
  });

  it('rebuilds the same endpoint from a restored destination', () => {
    expect(
      requestUrl(url('/help?q=boots'), { src: `${origin}/apps/search?view=fragment`, fold: true })
        .href,
    ).toBe(`${origin}/apps/search?view=fragment&q=boots`);
  });

  it('lets a destination name delete the `src` value of the same name', () => {
    expect(
      requestUrl(url('/help?view=list'), { src: `${origin}/search?view=fragment`, fold: true })
        .href,
    ).toBe(`${origin}/search?view=list`);
  });

  it('appends the later values of a repeated destination name', () => {
    const result = requestUrl(url('/search?genre=rock&genre=jazz'), {
      src: `${origin}/suggest?genre=stale&section=keep`,
      fold: true,
    });

    expect(result.searchParams.getAll('genre')).toEqual(['rock', 'jazz']);
    expect(result.searchParams.get('section')).toBe('keep');
  });

  it('sets `params` after the folded query', () => {
    expect(
      requestUrl(url('/help?q=shoes&view=list'), {
        src: `${origin}/apps/search`,
        params: { view: 'fragment' },
        fold: true,
      }).href,
    ).toBe(`${origin}/apps/search?q=shoes&view=fragment`);
  });

  it('keeps the origin of a cross-origin `src`', () => {
    expect(
      requestUrl(url('/help?q=a'), { src: 'https://api.example/search', fold: true }).href,
    ).toBe('https://api.example/search?q=a');
  });

  it('does not fold the destination query when `fold` is off', () => {
    expect(
      requestUrl(url('/page?unrelated=1'), { src: `${origin}/endpoint?a=1`, fold: false }).href,
    ).toBe(`${origin}/endpoint?a=1`);
  });

  it('drops the hash of the destination from the request', () => {
    expect(requestUrl(url('/help?q=a#results'), { src: `${origin}/search`, fold: true }).hash).toBe(
      '',
    );
  });
});

describe('stringRecord', () => {
  it('stringifies numbers and booleans from a JSON option, and drops null values', () => {
    expect(stringRecord({ page: 2, compact: true, name: 'a', empty: null })).toEqual({
      page: '2',
      compact: 'true',
      name: 'a',
    });
  });

  it('gives an empty record for a value that is not an object', () => {
    expect(stringRecord('nope')).toEqual({});
  });
});

describe('headerRecord', () => {
  it('reads a record, a list of tuples and a Headers instance with lower-case names', () => {
    expect(headerRecord({ 'X-A': '1' })).toEqual({ 'x-a': '1' });
    expect(headerRecord([['X-B', '2']])).toEqual({ 'x-b': '2' });
    expect(headerRecord(new Headers({ 'X-C': '3' }))).toEqual({ 'x-c': '3' });
    expect(headerRecord(undefined)).toEqual({});
  });
});

describe('encodeBody', () => {
  function formData(): FormData {
    const data = new FormData();
    data.append('q', 'hello');
    data.append('photo', new File(['pixels'], 'photo.png', { type: 'image/png' }));
    return data;
  }

  it('sends the FormData itself for multipart/form-data', () => {
    const data = formData();
    expect(encodeBody(data, 'multipart/form-data')).toEqual({ body: data, hasFile: false });
  });

  it('sends a URL-encoded body by default, with the name of the file', () => {
    const { body, hasFile } = encodeBody(formData(), 'application/x-www-form-urlencoded');
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(String(body)).toBe('q=hello&photo=photo.png');
    expect(hasFile).toBe(true);
  });

  it('sends name=value lines for text/plain', () => {
    expect(encodeBody(formData(), 'text/plain')).toEqual({
      body: 'q=hello\r\nphoto=photo.png\r\n',
      hasFile: true,
    });
  });
  /** Form data whose names and values hold every kind of line break. */
  function lineBreaks(): FormData {
    const data = new FormData();
    data.append('a\nb', 'x\ny');
    data.append('c', 'x\ry\r\nz');
    data.append('d', new File([''], 'one\ntwo.txt'));
    return data;
  }

  it('normalizes line breaks to CRLF in a URL-encoded body, as natively', () => {
    expect(String(encodeBody(lineBreaks(), '').body)).toBe(
      'a%0D%0Ab=x%0D%0Ay&c=x%0D%0Ay%0D%0Az&d=one%0D%0Atwo.txt',
    );
  });

  it('normalizes line breaks to CRLF in a text/plain body, as natively', () => {
    expect(encodeBody(lineBreaks(), 'text/plain').body).toBe(
      'a\r\nb=x\r\ny\r\nc=x\r\ny\r\nz\r\nd=one\r\ntwo.txt\r\n',
    );
  });

  it('normalizes line breaks to CRLF in the query of a GET form', () => {
    const { entries } = textEntries(lineBreaks());
    expect(new URLSearchParams(entries).toString()).toBe(
      'a%0D%0Ab=x%0D%0Ay&c=x%0D%0Ay%0D%0Az&d=one%0D%0Atwo.txt',
    );
  });
});

describe('responseDetail', () => {
  it('describes a response as plain data with lower-case header names and no body', () => {
    const detail = responseDetail(
      new Response('body', {
        status: 201,
        statusText: 'Created',
        headers: { 'X-Search-Result-Count': '42' },
      }),
    );

    expect(detail).toEqual({
      url: '',
      status: 201,
      statusText: 'Created',
      ok: true,
      redirected: false,
      headers: { 'content-type': 'text/plain;charset=UTF-8', 'x-search-result-count': '42' },
    });
    expect(Object.getPrototypeOf(detail)).toBe(Object.prototype);
  });
});
