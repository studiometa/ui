/** @type {Map<string, string>} */
const cache = new Map();

let controller = new AbortController();

/**
 * Transform the editor's content with Twig.
 * @param   {string} content
 * @returns {Promise<string>}
 */
export default async function twigLoader(content) {
  // Always abort previous requests
  controller.abort();

  // Return cached response early
  if (cache.has(content)) {
    return cache.get(content) ?? 'Failed to get cached response.';
  }

  controller = new AbortController();
  /** @type {string} */
  const url = window.location.hostname === 'localhost' ? 'https://ui.ddev.site/api' : '/api';

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
