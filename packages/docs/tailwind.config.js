import path from 'node:path';
import fs from 'node:fs';
import defaultConfig from 'tailwindcss/defaultConfig';
import { config as tailwindConfig } from '@studiometa/tailwind-config';

tailwindConfig.corePlugins = undefined;

const ui = path.resolve(__dirname, '../ui');
const folders = fs
  .readdirSync(ui, { withFileTypes: true })
  .filter((item) => item.isDirectory() && item.name !== 'node_modules')
  .map((item) => path.resolve(ui, item.name));

export default {
  presets: [defaultConfig, tailwindConfig],
  content: [
    ...folders.map((folder) => path.relative(__dirname, path.resolve(folder, '**/*.md'))),
    ...folders.map((folder) => path.relative(__dirname, path.resolve(folder, '**/*.js'))),
    ...folders.map((folder) => path.relative(__dirname, path.resolve(folder, '**/*.vue'))),
    ...folders.map((folder) => path.relative(__dirname, path.resolve(folder, '**/*.twig'))),
    './.vitepress/theme/**/*.js',
    './.vitepress/theme/**/*.vue',
    './.vitepress/theme/**/*.ts',
  ],
  theme: {
    extend: {
      zIndex: {
        above: 1,
      },
      cursor: {
        grab: 'grab',
        grabbing: 'grabbing',
      },
      colors: {
        vp: {
          'text-1': 'var(--vp-c-text-1)',
          bg: 'var(--vp-c-bg)',
          'bg-alt': 'var(--vp-c-bg-alt)',
          'bg-soft': 'var(--vp-c-bg-soft)',
          'code-block-bg': 'var(--vp-code-block-bg)',
          'c-indigo': 'var(--vp-c-indigo)',
          'c-divider': 'var(--vp-c-divider)',
          'c-divider-light': 'var(--vp-c-divider-light)',
          'c-gutter': 'var(--vp-c-gutter)',
        },
        brand: {
          DEFAULT: '#3451b2',
          light: 'rgba(100, 108, 255, .16)',
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
    opacity: ['disabled', ...(defaultConfig?.variants?.cursor ?? [])],
    extend: {
      cursor: ['active', ...(defaultConfig?.variants?.cursor ?? [])],
      ringOpacity: ['hover', 'active', 'focus'],
    },
  },
};
