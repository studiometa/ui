import useApp from './app.js';

import addons from '@storybook/addons';
import createChannel from '@storybook/channel-postmessage';
import { objectToURLSearchParams } from '@studiometa/js-toolkit/utils/history';
import nextFrame from '@studiometa/js-toolkit/utils/nextFrame';

const withoutTrailingSlash = (string) => string.replace(/\/$/, '');

const { APP_SSL, APP_HOST, STORYBOOK_SERVER_URL } = process.env;
const origin = 'http://127.0.0.1:8000';

export const parameters = {
  server: {
    url: `${withoutTrailingSlash(origin)}/api`,
    async fetchStoryHtml(url, path, params, context) {
      // Add local origin if none provided.
      if (!url.startsWith('http')) {
        url = `${window.location.origin}${url}`;
      }

      const fetchUrl = new URL(url);

      fetchUrl.search = objectToURLSearchParams({
        ...context.globals,
        ...params,
        path,
      }).toString();
      const finalUrl = fetchUrl.toString();

      // Do not cache request in dev mode
      if (process.env.NODE_ENV === 'development') {
        const response = await fetch(finalUrl, {mode: 'no-cors'});

        // if (app) {
        nextFrame(async () => {
          const app = await useApp();
          app.$update();
        })
        // }
        console.log(await response.text());
        return response.text();
      }

      if (!cache[finalUrl]) {
        const response = await fetch(finalUrl);

        // if (app) {
        //   nextFrame(() => {
        //     app.$update();
        //   })
        // }

        nextFrame(async () => {
          const app = await useApp();
          app.$update();
        })

        cache[finalUrl] = response.text();
      }

      return cache[finalUrl];
    },
  },
};

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
