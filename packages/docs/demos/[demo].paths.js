export default {
  async paths() {
    const demos = await (await fetch(`https://ui.studiometa.dev/api/demos/`)).json();

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
