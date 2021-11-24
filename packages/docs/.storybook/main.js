const path = require('path');

module.exports = {
  stories: [
    '../../ui/**/*.stories.mdx',
    '../../ui/**/*.stories.@(json)',
    '../../ui/**/*.stories.yml',
  ],
  logLevel: 'debug',
  core: {
    builder: 'webpack5',
  },
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
    '@storybook/addon-backgrounds',
    '@storybook/addon-controls',
    '@storybook/addon-docs',
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
