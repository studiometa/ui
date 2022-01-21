import { createRequire } from 'module';
import { defineConfig } from 'vitepress';
import { basename, dirname, resolve, join } from 'path';
import { withLeadingSlash, withTrailingSlash } from '@studiometa/js-toolkit/utils';
import glob from 'fast-glob';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

export default defineConfig({
  lang: 'en-US',
  title: '@studiometa/ui',
  description: 'A set of opiniated, unstyled and accessible components',
  base: '/-/',
  outDir: './.symfony/public/-',
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/-/logo.png' }],
  ],
  themeConfig: {
    version: pkg.version,
    repo: 'studiometa/ui',
    docsDir: 'packages/vitepress',
    lastUpdated: 'Last updated',
    editLinks: true,
    editLinkText: 'Edit this page on GitHub',
    sidebarDepth: 4,
    nav: [
      { text: 'Guide', link: '/guide/concepts/' },
      { text: 'Components', link: '/components/' },
      { text: 'Release Notes', link: 'https://github.com/studiometa/ui/releases' },
    ],
    sidebar: {
      '/': [
        {
          text: 'Guide',
          link: '/guide/concepts/',
          children: getGuideSidebar(),
        },
        {
          text: 'Components',
          children: getComponentsSidebar(),
        }
      ],
    },
  },
});

function getGuideSidebar() {
  return [
    { text: 'Concepts', link: '/guide/concepts/' },
    { text: 'Installation', link: '/guide/installation/' },
    { text: 'Usage', link: '/guide/usage/' },
    { text: 'Migration guide', link: '/guide/migration/' },
  ];
}

function getComponentsSidebar() {
  return [
    {
      text: 'Primitives',
      link: '/components/primitives/',
      children: generateSidebarLinksFromPath('components/primitives/*/index.md'),
    },
    {
      text: 'Atoms',
      link: '/components/atoms/',
      children: generateSidebarLinksFromPath('components/atoms/*/index.md'),
    },
    {
      text: 'Molecules',
      link: '/components/molecules/',
      children: generateSidebarLinksFromPath('components/molecules/*/index.md'),
    },
    {
      text: 'Organisms',
      link: '/components/organisms/',
      children: generateSidebarLinksFromPath('components/organisms/*/index.md'),
    },
  ];
}

function generateSidebarLinksFromPath(globs: string | string[]) {
  return glob.sync(globs).map((entry) => ({
    link: withLeadingSlash(withTrailingSlash(dirname(entry))),
    text: basename(dirname(entry)),
  }));
}
