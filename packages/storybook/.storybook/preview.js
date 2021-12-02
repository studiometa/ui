import addons from '@storybook/addons';
import createChannel from '@storybook/channel-postmessage';
import { objectToURLSearchParams, withoutTrailingSlash } from '@studiometa/js-toolkit/utils';
import { withLinks } from '@storybook/addon-links';

import useApp from './app.js';

export const decorators = [withLinks];

export const parameters = {
  server: {
    url: `${withoutTrailingSlash(process.env.APP_URL)}/api`,
    async fetchStoryHtml(url, id, params, context) {
      const fetchUrl = new URL(url);

      fetchUrl.search = objectToURLSearchParams({
        ...context.globals,
        ...params,
        id,
      }).toString();

      const response = await fetch(fetchUrl.toString());

      return response.text();
    },
  },
};
