import { snakeCase } from 'snake-case';
import { withoutTrailingSlash, objectToURLSearchParams } from '@studiometa/js-toolkit/utils';

const cache = new Map();

/**
 * Fetch a rendered Twig template.
 *
 * @param {Record<string, any>} params
 *   Additional parameters.
 * @param {AbortController} controller
 *   An AbortController instance to be able to cancel the request.
 *
 * @return {string}
 *   The rendered template.
 */
export async function fetchRenderedTwig(params = {}, controller = new AbortController()) {
  if (typeof window === 'undefined') {
    return '';
  }

  const APP_URL = import.meta.env.DEV ? 'https://ui.ddev.site' : window.location.origin;
  const TWIG_RENDER_ENDPOINT = `${withoutTrailingSlash(APP_URL)}/api`;
  const fetchUrl = new URL(TWIG_RENDER_ENDPOINT);
  const hasTpl = typeof params.tpl !== 'undefined';

  const search = objectToURLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (key === 'tpl') {
        return acc;
      }

      acc[snakeCase(key)] = value;
      return acc;
    }, {})
  );

  fetchUrl.search = search.toString();

  const cacheKey = fetchUrl.toString();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const response = await fetch(fetchUrl.toString(), {
    method: hasTpl ? 'POST' : 'GET',
    body: params.tpl,
    signal: controller.signal,
  });
  const content = await response.text();

  cache.set(cacheKey, content);

  return content;
}
