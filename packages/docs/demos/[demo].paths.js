import { loadEnv } from 'vitepress';

const env = loadEnv('', process.cwd());

export default {
  async paths() {
    const url = env.APP_URL ?? 'http://ui.ddev.site';
    console.log(url, env.APP_URL);
    const demos = await (await fetch(`${url}/api/demos/`)).json();

    return demos.map((demo) => {
      return {
        params: {
          demo: demo.id,
          title: demo.title,
          iframe_link: demo.iframe_link,
          author: demo.author,
          created_at: demo.created_at,
          updated_at: demo.updated_at,
        },
        content: demo.content,
      };
    });
  },
};
