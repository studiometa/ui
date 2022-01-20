import { snakeCase } from 'snake-case'
import { withoutTrailingSlash, objectToURLSearchParams } from '@studiometa/js-toolkit';

const APP_URL = 'https://ui.ddev.site';
const TWIG_RENDER_ENDPOINT = `${withoutTrailingSlash(APP_URL)}/api`;

const cache = new Map();

/**
 * Fetch a rendered Twig template.
 *
 * @param {string} path
 *   The template path.
 * @param {Record<string, any>} params
 *   Additional parameters.
 * @param {AbortController} controller
 *   An AbortController instance to be able to cancel the request.
 *
 * @return {string}
 *   The rendered template.
 */
export async function fetchRenderedTwig(path, params = {}, controller = new AbortController()) {
  const fetchUrl = new URL(TWIG_RENDER_ENDPOINT);

  const search = objectToURLSearchParams({
    ...Object.entries(params).reduce((acc, [key, value]) => {
      acc[snakeCase(key)] = value;
      return acc;
    }, {}),
    path,
  });

  fetchUrl.search = search.toString();

  const cacheKey = fetchUrl.toString();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const response = await fetch(fetchUrl.toString(), { signal: controller.signal });
  const content = await response.text();

  cache.set(cacheKey, content);

  return content;
}
