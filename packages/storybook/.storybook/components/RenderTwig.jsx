import React, { useState, useEffect, useCallback } from 'react';
import parse from 'html-react-parser';
import { snakeCase } from 'snake-case'
import { withoutTrailingSlash, objectToURLSearchParams } from '@studiometa/js-toolkit/utils';
import { Loader } from '@storybook/components';

const TWIG_RENDER_ENDPOINT = `${withoutTrailingSlash(process.env.APP_URL)}/api`;
const TWIG_SOURCE_ENDPOINT = `${withoutTrailingSlash(process.env.APP_URL)}/api/source`;

/**
 * Fetch a rendered Twig template.
 *
 * @param {string} id
 *   The template name.
 * @param {Record<string, any>} params
 *   Additional parameters.
 * @param {AbortController} controller
 *   An AbortController instance to be able to cancel the request.
 *
 * @return {string}
 *   The rendered template.
 */
async function fetchRenderedTwig(id, params = {}, controller = new AbortController()) {
  const fetchUrl = new URL(TWIG_RENDER_ENDPOINT);

  const search = objectToURLSearchParams({
    ...Object.entries(params).reduce((acc, [key, value]) => {
      acc[snakeCase(key)] = value;
      return acc;
    }, {}),
    id,
  });

  if (process.env.NODE_ENV === 'development') {
    search.set('__t', performance.now());
  }

  fetchUrl.search = search.toString();

  const response = await fetch(fetchUrl.toString(), { signal: controller.signal });
  return response.text();
}

/**
 * Fetch the source of the given template.
 *
 * @param  {string} id The template name.
 * @return {string}    The template source.
 */
async function fetchTwigSource(id) {
  return fetch(TWIG_SOURCE_ENDPOINT).then((response) => response.text());
}

/**
 * Normalize props to params for the RenderTwig component.
 *
 * @param  {{ id: string } & Record<string, any>} props
 * @return {Record<string, any>}
 */
function normalizeParams(props) {
  return Object.entries(props).reduce((acc, [key, value]) => {
    // Exclude internal props
    if (['className'].includes(key)) {
      return acc;
    }

    // Convert children to a Twig template to render
    if (key === 'children') {
      acc.tpl = value;
      return acc;
    }

    acc[key] = value;

    return acc;
  }, {});
}

/**
 * Render a Twig template
 * @param {{ id: string } & Record<string, any>} props
 */
export function RenderTwig(props) {
  const [content, setContent] = useState(null);
  const params = normalizeParams(props);

  const fetchHtml = useCallback(async (controller) => {
    try {
      const data = await fetchRenderedTwig(props.id, params, controller);
      setContent(data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted.');
      } else {
        console.error(error)
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchHtml(controller);
    return () => controller.abort();
  }, []);

  return <div className={props.className ?? ''}>{content ? parse(content) : <Loader />}</div>;
}

/**
 * Get a Twig template source
 * @param {{ id: string }} props
 */
export function TwigSource(props) {
  const [content, setContent] = useState(null);

  useEffect(async () => {
    const data = await fetchTwigSource(props.id);
    setContent(data);
  });

  return <div>{content ?? Loader()}</div>;
}
