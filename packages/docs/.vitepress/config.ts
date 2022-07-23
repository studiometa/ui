import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { defineConfig } from 'vitepress';
import { basename, dirname, resolve, join } from 'path';
import { withLeadingSlash, withTrailingSlash } from '@studiometa/js-toolkit/utils';
import glob from 'fast-glob';
import fs from 'node:fs';

const pkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), { encoding: 'utf8' })
);

export default defineConfig({
  lang: 'en-US',
  title: '@studiometa/ui',
  description: 'A set of opiniated, unstyled and accessible components',
  lastUpdated: true,
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
    footer: {
      message: 'MIT Licensed',
      copyright: 'Copyright © 2020–present Studio Meta',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/studiometa/ui' }],

    nav: [
      { text: 'Guide', link: '/guide/concepts/' },
      {
        text: 'Components',
        link: '/components/',
      },
      {
        text: `v${pkg.version}`,
        items: [{ text: 'Release Notes', link: 'https://github.com/studiometa/ui/releases' }],
      },
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
      items: [
        { text: 'Concepts', link: '/guide/concepts/' },
        { text: 'Installation', link: '/guide/installation/' },
        { text: 'Usage', link: '/guide/usage/' },
      ],
    },
    {
      text: 'Migration guides',
      link: '/migration-guides/',
      items: generateSidebarLinksFromPath('migration-guides/*/index.md', {
        extractTitle: true,
        collapsible: false,
      }),
    },
  ];
}

function getComponentsSidebar() {
  return [
    {
      text: 'Primitives',
      link: '/components/primitives/',
      items: generateSidebarLinksFromPath('components/primitives/*/index.md', { extractTitle: true }),
      collapsible: true,
    },
    {
      text: 'Atoms',
      link: '/components/atoms/',
      items: generateSidebarLinksFromPath('components/atoms/*/index.md', { extractTitle: true }),
      collapsible: true,
    },
    {
      text: 'Molecules',
      link: '/components/molecules/',
      items: generateSidebarLinksFromPath('components/molecules/*/index.md', { extractTitle: true }),
      collapsible: true,
    },
    {
      text: 'Organisms',
      link: '/components/organisms/',
      items: generateSidebarLinksFromPath('components/organisms/*/index.md', { extractTitle: true }),
      collapsible: true,
    },
  ];
}

function generateSidebarLinksFromPath(
  globs: string | string[],
  { extractTitle = false, collapsible = false, collapsed = false } = {}
) {
  return glob.sync(globs).map((entry) => ({
    text: extractTitle ? getEntryTitle(entry) : basename(dirname(entry)),
    link: withLeadingSlash(entry.replace(/\/index\.md$/, '/').replace(/\.md$/, '.html')),
    items: entry.endsWith('/index.md')
      ? [
          ...generateSidebarLinksFromPath(entry.replace(/\/index\.md$/, '/*[!index]*.md'), {
            extractTitle: true,
          }),
        ]
      : [],
    collapsible,
    collapsed,
  }));
}

function getEntryTitle(entry) {
  const content = readFileSync(entry, { encoding: 'UTF-8' });
  const [title] = content.match(/^#\s+.*$/m) ?? [];

  return title ? title.replace(/^#\s?/, '').replace(/(<([^>]+)>)/ig, '') : basename(dirname(entry));
}
