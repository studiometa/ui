import { isDev } from '@studiometa/js-toolkit/utils';

const cache = new Map<string, string>();

// @todo: cancel previous running requests to avoid accidentally
// updating the HTML content with a longer previous request response.
// A ------> A'
//  B ----> B'
// A' will be used instead of B'
let controller = new AbortController();

export async function twigRender(content: string) {
  // Always abort previous requests
  controller.abort();

  // Return cached response early
  if (cache.has(content)) {
    return cache.get(content) ?? 'Failed to get cached response.';
  }

  controller = new AbortController();
  const url: string = isDev ? 'https://ui.ddev.site/api' : '/api';

  return fetch(url, {
    method: 'POST',
    body: content,
    signal: controller.signal,
  })
    .then(async (res) => {
      const result = await res.text();
      cache.set(content, result);
      return result;
    })
    .catch((err) => err.name !== 'AbortError' && console.error(err.message));
}
