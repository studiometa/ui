import React, { useState, useEffect, createElement } from 'react';
import parse from 'html-react-parser';
import { withoutTrailingSlash, objectToURLSearchParams } from '@studiometa/js-toolkit/utils';
import { Loader } from '@storybook/components';

const TWIG_RENDER_ENDPOINT = `${withoutTrailingSlash(process.env.APP_URL)}/api`;
const TWIG_SOURCE_ENDPOINT = `${withoutTrailingSlash(process.env.APP_URL)}/api/source`;

/**
 * Fetch a rendered Twig template.
 * @param  {string} id                  The template name.
 * @param  {Record<string, any>} params Additional parameters.
 * @return {string}                     The rendered template.
 */
async function fetchRenderedTwig(id, params = {}) {
  const fetchUrl = new URL(TWIG_RENDER_ENDPOINT);

  fetchUrl.search = objectToURLSearchParams({
    ...params,
    id,
  }).toString();

  const response = await fetch(fetchUrl.toString());

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
 * Render a Twig template
 * @param {{ id: string, params?: Record<string, any> }} props
 */
export function RenderTwig(props) {
  const [content, setContent] = useState(null);
  const params = Object.entries(props).reduce((acc, [key, value]) => {
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

  useEffect(async () => {
    const data = await fetchRenderedTwig(props.id, params);
    setContent(data);
  }, []);

  return (
    <div className={props.className ?? ''}>{content ? parse(content) : <Loader />}</div>
  );
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

  return createElement('div', null, content ?? Loader());
}
