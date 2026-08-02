import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { withLeadingSlash } from '@studiometa/js-toolkit/utils';
import glob from 'fast-glob';
import { defineConfig } from 'vitepress';
import pkg from '../package.json' with { type: 'json' };
import { componentTaskLabels, referenceCatalog } from './reference/catalog.js';
import type { ReferenceKind } from './reference/types.js';

export default defineConfig({
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'playground-preview',
      },
    },
  },
  ignoreDeadLinks: 'localhostLinks',
  lang: 'en-US',
  title: '@studiometa/ui',
  description: 'A feature-rich library of primitives and components built with ♥️ by Studio Meta',
  lastUpdated: true,
  srcExclude: ['**/.symfony/**'],
  head: [
    [
      'script',
      {
        defer: '',
        'data-domain': 'ui.studiometa.dev',
        src: 'https://plausible.io/js/script.outbound-links.js',
      },
    ],
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/logo.png' }],
  ],
  markdown: {
    codeTransformers: [transformerTwoslash()],
    // Explicitly load these languages for types hightlighting
    languages: ['js', 'jsx', 'ts', 'tsx'],
  },
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
        url: item.url,
      }));
    },
  },
  themeConfig: {
    outline: 'deep',
    version: pkg.version,
    repo: 'studiometa/ui',
    docsDir: 'packages/docs',
    lastUpdated: { text: 'Last updated' },
    editLinks: true,
    editLinkText: 'Edit this page on GitHub',
    sidebarDepth: 4,
    search: {
      provider: 'local',
    },
    footer: {
      message: 'MIT Licensed',
      copyright:
        'Copyright © 2020–present <a href="https://www.studiometa.fr" target="_blank" rel="noopener">Studio Meta</a>',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/studiometa/ui' }],

    nav: [
      { text: 'Guide', link: '/guide/concepts/' },
      {
        text: 'Reference',
        link: '/reference/',
      },
      {
        text: 'Playground',
        link: process.env.NODE_ENV === 'development' ? '/play/index.html' : '/play/',
        target: '_blank',
      },
      {
        text: `<span class="VPBadge font-bold bg-[var(--vp-button-brand-bg)] text-[var(--vp-button-brand-text)]">v${pkg.version}</span>`,
        items: [
          { text: 'Release Notes', link: 'https://github.com/studiometa/ui/releases' },
          { text: 'Migration guides', link: '/migration-guides/' },
        ],
      },
    ],
    sidebar: {
      '/reference/': getReferenceSidebar(),
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
        { text: 'ESLint Plugin', link: '/guide/eslint-plugin/' },
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

function getReferenceSidebar() {
  function linksForKind(kind: ReferenceKind) {
    return referenceCatalog
      .filter((entry) => entry.kind === kind)
      .toSorted((a, b) => a.title.localeCompare(b.title))
      .map((entry) => ({ text: entry.title, link: entry.path }));
  }

  const componentGroups = Object.entries(componentTaskLabels)
    .map(([task, text]) => ({
      text,
      collapsed: true,
      items: referenceCatalog
        .filter((entry) => entry.kind === 'component' && entry.primaryTask === task)
        .toSorted((a, b) => a.title.localeCompare(b.title))
        .map((entry) => ({ text: entry.title, link: entry.path })),
    }))
    .filter((group) => group.items.length);

  return [
    {
      text: 'Reference',
      link: '/reference/',
      items: [
        { text: 'Overview', link: '/reference/' },
        { text: 'All exports', link: '/reference/all-exports/' },
        { text: 'Types', link: '/reference/types/' },
      ],
    },
    {
      text: 'Components',
      link: '/reference/components/',
      items: componentGroups,
    },
    {
      text: 'Primitives',
      link: '/reference/primitives/',
      collapsed: true,
      items: linksForKind('primitive'),
    },
    {
      text: 'Decorators',
      link: '/reference/decorators/',
      collapsed: true,
      items: linksForKind('decorator'),
    },
    {
      text: 'Helpers and utilities',
      link: '/reference/helpers/',
      collapsed: true,
      items: linksForKind('helper'),
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
          ...generateSidebarLinksFromPath(entry.replace(/\/index\.md$/, '/*/index.md'), {
            extractTitle: true,
            collapsed: true,
          }),
          ...generateSidebarLinksFromPath(entry.replace(/\/index\.md$/, '/*[!index]*.md'), {
            extractTitle: true,
          }),
        ].sort((a, b) => a.text.localeCompare(b.text))
      : [],
    collapsed,
  }));
}

function getEntryTitle(entry) {
  const content = readFileSync(entry, { encoding: 'utf-8' });
  const [title] = content.match(/^#\s+.*$/m) ?? [];

  return title ? title.replace(/^#\s?/, '').replace(/(<([^>]+)>)/gi, '') : basename(dirname(entry));
}
