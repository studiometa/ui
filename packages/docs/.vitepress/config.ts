import { createRequire } from 'module';
import { readFileSync } from 'fs';
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
  srcExclude: ['**/.symfony/**'],
  head: [['link', { rel: 'icon', type: 'image/x-icon', href: '/-/logo.png' }]],
  themeConfig: {
    version: pkg.version,
    repo: 'studiometa/ui',
    docsDir: 'packages/docs',
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
      '/components/': getComponentsSidebar(),
      '/': getGuideSidebar(),
    },
  },
});

function getGuideSidebar() {
  return [
    {
      text: 'Guide',
      children: [
        { text: 'Concepts', link: '/guide/concepts/' },
        { text: 'Installation', link: '/guide/installation/' },
        { text: 'Usage', link: '/guide/usage/' },
      ],
    },
    {
      text: 'Migration guides',
      link: '/migration-guides/',
      children: generateSidebarLinksFromPath('migration-guides/*/index.md', {
        extractTitle: true,
      }),
    },
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

function generateSidebarLinksFromPath(globs: string | string[], { extractTitle = false } = {}) {
  return glob.sync(globs).map((entry) => ({
    link: withLeadingSlash(withTrailingSlash(dirname(entry))),
    text: extractTitle ? getEntryTitle(entry) : basename(dirname(entry)),
  }));
}

function getEntryTitle(entry) {
  const content = readFileSync(entry, { encoding: 'UTF-8' });
  const [title] = content.match(/^#\s+.*$/m);

  return title ? title.replace(/^#\s?/, '') : basename(dirname(entry));
}
