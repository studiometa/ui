import { loadEnv } from 'vitepress';

const env = loadEnv('', process.cwd());

export default {
  async paths() {
    const url = env.APP_URL ?? 'http://ui.ddev.site';
    const demos = await (await fetch(`${url}/api/demos/`)).json();

    return demos.map((demo) => {
      return {
        params: {
          demo: demo.slug,
          title: demo.title,
          iframe_link: demo.iframe_link,
          lastUpdated: demo.updated_at,
        },
        content: demo.content,
      };
    });
  },
};
