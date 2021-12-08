function alterPublicPath(config) {
  if (process.env.NODE_ENV === 'production') {
    config.output.publicPath = '/-/';
  }

  config.cache = true;

  return config;
}

module.exports = {
  stories: ['../**/*.stories.mdx'],
  logLevel: 'debug',
  core: {
    builder: 'webpack5',
    manager: 'webpack5',
  },
  reactOptions: {
    fastRefresh: true,
  },
  webpackFinal: alterPublicPath,
  managerWebpack: alterPublicPath,
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true,
      },
    },
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
    '@storybook/addon-backgrounds',
    '@storybook/addon-controls',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss'),
        },
      },
    },
  ],
};
