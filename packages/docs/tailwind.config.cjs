const path = require('path');
const fs = require('fs');
const defaultConfig = require('tailwindcss/defaultConfig');
const tailwindConfig = require('@studiometa/tailwind-config');

tailwindConfig.corePlugins = undefined;

const ui = path.resolve(__dirname, '../ui');
const folders = fs
  .readdirSync(ui, { withFileTypes: true })
  .filter((item) => item.isDirectory() && item.name !== 'node_modules')
  .map((item) => path.resolve(ui, item.name));

module.exports = {
  presets: [defaultConfig, tailwindConfig],
  // mode: 'jit',
  purge: [
    ...folders.map((folder) => path.resolve(folder, '**/*.js')),
    ...folders.map((folder) => path.resolve(folder, '**/*.vue')),
    ...folders.map((folder) => path.resolve(folder, '**/*.twig')),
    './.vitepress/**/*.js',
    './.vitepress/**/*.vue',
    './.vitepress/**/*.ts',
    './**/*.md',
    './**/*.vue',
    './**/*.js',
    './**/*.html',
    './**/*.twig',
  ],
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  theme: {
    extend: {
      cursor: {
        grab: 'grab',
        grabbing: 'grabbing',
      },
      colors: {
        brand: {
          DEFAULT: '#3eaf7c',
          light: '#42d392',
        },
        code: {
          bg: 'var(--code-bg-color)',
        },
      },
      fontSize: {
        '2xs': ['0.625rem', '1'],
      },
      maxHeight: defaultConfig.theme.maxWidth,
    },
  },
  variants: {
    opacity: ['disabled', ...defaultConfig.variants.cursor],
    extend: {
      cursor: ['active', ...defaultConfig.variants.cursor],
      ringOpacity: ['hover', 'active', 'focus'],
    },
  },
};
