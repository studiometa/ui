import addons from '@storybook/addons';
import createChannel from '@storybook/channel-postmessage';
import {
  objectToURLSearchParams,
  nextFrame,
  withoutTrailingSlash,
} from '@studiometa/js-toolkit/utils';
import { withLinks } from '@storybook/addon-links';

import useApp from '../assets/js/app.js';

const origin = process.env.APP_URL ?? 'http://127.0.0.1:8000';

console.log(process.env.APP_URL);

export const decorators = [withLinks];

export const parameters = {
  server: {
    url: `${withoutTrailingSlash(origin)}/api`,
    async fetchStoryHtml(url, id, params, context) {
      const fetchUrl = new URL(url);

      fetchUrl.search = objectToURLSearchParams({
        ...context.globals,
        ...params,
        id,
      }).toString();
      const finalUrl = fetchUrl.toString();

      const response = await fetch(finalUrl);

      nextFrame(async () => {
        const app = await useApp();
        app.$update();
      });

      return response.text();
    },
  },
};
/*
// if (process.env.NODE_ENV === 'development') {
  const ws = new WebSocket('ws://localhost:40510');
  const isBrowser =
    navigator &&
    navigator.userAgent &&
    navigator.userAgent !== 'storyshots' &&
    !(navigator.userAgent.indexOf('Node.js') > -1) &&
    !(navigator.userAgent.indexOf('jsdom') > -1);

  function getOrCreateChannel() {
    let channel = null;
    if (isBrowser) {
      try {
        channel = addons.getChannel();
      } catch (e) {
        channel = createChannel({ page: 'preview' });
        addons.setChannel(channel);
      }
    }

    return channel;
  }

  ws.onopen = function () {
    console.log('[WS] WebSocket is connected ...');
  };

  ws.onmessage = function () {
    const channel = getOrCreateChannel();
    if (channel) {
      console.log('[WS] Rerendering...');
      channel.emit('forceReRender');
    }
  };

  if (module.hot) {
    module.hot.dispose(() => {
      ws.close();
    });
  }
// };
*/
