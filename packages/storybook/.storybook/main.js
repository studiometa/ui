const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

function alterPublicPath(config) {
  if (process.env.NODE_ENV === 'production') {
    config.output.publicPath = '/.storybook/';
  }

  return config;
}

module.exports = {
  stories: [
    '../**/*.stories.mdx',
    '../**/*.stories.@(json)',
    '../**/*.stories.yml',
    '../**/*.stories.js',
  ],
  logLevel: 'debug',
  core: {
    builder: 'webpack5',
    manager: 'webpack5',
  },
  webpackFinal: alterPublicPath,
  managerWebpack: alterPublicPath,
  addons: [
    '@storybook/addon-docs',
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
