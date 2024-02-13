import { readFileSync } from 'node:fs';
import { basename, dirname, resolve, join } from 'node:path';
import { defineConfig } from 'vitepress';
import {
  withLeadingSlash,
  withTrailingSlash,
  withLeadingCharacters,
} from '@studiometa/js-toolkit/utils';
import glob from 'fast-glob';

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), { encoding: 'utf8' }),
);

export default defineConfig({
  lang: 'en-US',
  title: '@studiometa/ui',
  description: 'A feature-rich library of primitives and components built with ♥️ by Studio Meta',
  lastUpdated: true,
  base: '/-/',
  outDir: './.symfony/public/-',
  srcExclude: ['**/.symfony/**'],
  head: [
    [
      'script',
      { defer: '', 'data-domain': 'ui.studiometa.dev', src: 'https://p.analytic.sh/js/script.js' },
    ],
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/-/logo.png' }],
  ],
  sitemap: {
    hostname: 'https://ui.studiometa.dev/',
    transformItems(items) {
      // Add the playground
      items.push({
        url: 'play',
        changefreq: 'monthly',
        priority: 0.8,
      });

      // Add base URL
      return items.map((item) => ({
        ...item,
        url: withLeadingCharacters(item.url, '-/'),
      }));
    },
  },
  themeConfig: {
    version: pkg.version,
    repo: 'studiometa/ui',
    docsDir: 'packages/docs',
    lastUpdated: 'Last updated',
    editLinks: true,
    editLinkText: 'Edit this page on GitHub',
    sidebarDepth: 4,
    search: {
      provider: 'local',
    },
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
        text: 'Playground',
        link: '/play/',
        target: '_blank',
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
        { text: 'Contributing', link: '/guide/contributing/' },
      ],
    },
    {
      text: 'Migration guides',
      link: '/migration-guides/',
      items: generateSidebarLinksFromPath('migration-guides/*/index.md', {
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
      items: generateSidebarLinksFromPath('components/primitives/*/index.md', {
        extractTitle: true,
        collapsed: true,
      }),
      collapsed: false,
    },
    {
      text: 'Atoms',
      link: '/components/atoms/',
      items: generateSidebarLinksFromPath('components/atoms/*/index.md', {
        extractTitle: true,
        collapsed: true,
      }),
      collapsed: false,
    },
    {
      text: 'Molecules',
      link: '/components/molecules/',
      items: generateSidebarLinksFromPath('components/molecules/*/index.md', {
        extractTitle: true,
        collapsed: true,
      }),
      collapsed: false,
    },
    {
      text: 'Organisms',
      link: '/components/organisms/',
      items: generateSidebarLinksFromPath('components/organisms/*/index.md', {
        extractTitle: true,
        collapsed: true,
      }),
      collapsed: false,
    },
  ];
}

function generateSidebarLinksFromPath(
  globs: string | string[],
  {
    extractTitle = false,
    collapsed = undefined,
  }: { extractTitle?: boolean; collapsed?: boolean } = {},
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
    collapsed,
  }));
}

function getEntryTitle(entry) {
  const content = readFileSync(entry, { encoding: 'utf-8' });
  const [title] = content.match(/^#\s+.*$/m) ?? [];

  return title ? title.replace(/^#\s?/, '').replace(/(<([^>]+)>)/gi, '') : basename(dirname(entry));
}
