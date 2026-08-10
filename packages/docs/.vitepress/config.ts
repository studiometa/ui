import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import ts from 'typescript';
import { withLeadingSlash } from '@studiometa/js-toolkit/utils';
import glob from 'fast-glob';
import { defineConfig } from 'vitepress';
import pkg from '../package.json' with { type: 'json' };
import { conceptCatalog } from './concepts/catalog.js';
import { componentTaskLabels, referenceCatalog } from './reference/catalog.js';
import type { ReferenceCatalogEntry, ReferenceKind } from './reference/types.js';

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
    // `@studiometa/ui` and `@studiometa/ui-mapbox` publish their built `dist/`, but their `exports`
    // maps expose a `typescript` condition pointing at the `.ts` sources. Activate it so Twoslash
    // type-checks the code samples against source, without requiring a build of the `dist/` types.
    codeTransformers: [
      transformerTwoslash({
        twoslashOptions: {
          compilerOptions: {
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            customConditions: ['typescript'],
          },
        },
      }),
    ],
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
      { text: 'Guide', link: '/guide/' },
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
        { text: 'Overview', link: '/guide/' },
        {
          text: 'Concepts',
          link: '/guide/concepts/',
          items: conceptCatalog.map((concept) => ({
            text: concept.slug === 'index' ? 'Overview' : concept.title,
            link: concept.path,
          })),
        },
        { text: 'Installation', link: '/guide/installation/' },
        { text: 'Autoloading', link: '/guide/autoloading/' },
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
      .map(getReferenceSidebarItem);
  }

  const componentGroups = Object.entries(componentTaskLabels)
    .map(([task, text]) => ({
      text,
      collapsed: true,
      items: referenceCatalog
        .filter((entry) => entry.kind === 'component' && entry.primaryTask === task)
        .toSorted((a, b) => a.title.localeCompare(b.title))
        .map(getReferenceSidebarItem),
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

function getReferenceSidebarItem(entry: ReferenceCatalogEntry) {
  return {
    ...generateSidebarLinkFromEntry(`${entry.path.slice(1)}index.md`, {
      extractTitle: true,
      collapsed: true,
    }),
    text: entry.title,
    link: entry.path,
  };
}

function generateSidebarLinksFromPath(
  globs: string | string[],
  options: { extractTitle?: boolean; collapsed?: boolean } = {},
) {
  return glob.sync(globs).map((entry) => generateSidebarLinkFromEntry(entry, options));
}

function generateSidebarLinkFromEntry(
  entry: string,
  {
    extractTitle = false,
    collapsed = undefined,
  }: { extractTitle?: boolean; collapsed?: boolean } = {},
) {
  const childEntries = entry.endsWith('/index.md')
    ? [
        ...glob.sync(entry.replace(/\/index\.md$/, '/*/index.md')),
        ...glob
          .sync(entry.replace(/\/index\.md$/, '/*.md'))
          .filter((childEntry) => basename(childEntry) !== 'index.md'),
      ]
    : [];

  return {
    text: extractTitle ? getEntryTitle(entry) : basename(dirname(entry)),
    link: withLeadingSlash(entry.replace(/\/index\.md$/, '/').replace(/\.md$/, '.html')),
    items: childEntries
      .map((childEntry) =>
        generateSidebarLinkFromEntry(childEntry, {
          extractTitle: true,
          collapsed: childEntry.endsWith('/index.md') ? true : undefined,
        }),
      )
      .sort((a, b) => a.text.localeCompare(b.text)),
    collapsed,
  };
}

function getEntryTitle(entry) {
  const content = readFileSync(entry, { encoding: 'utf-8' });
  const [title] = content.match(/^#\s+.*$/m) ?? [];

  return title ? title.replace(/^#\s?/, '').replace(/(<([^>]+)>)/gi, '') : basename(dirname(entry));
}
