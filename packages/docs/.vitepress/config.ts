import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { defineConfig } from 'vitepress';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { withLeadingSlash, withLeadingCharacters } from '@studiometa/js-toolkit/utils';
import glob from 'fast-glob';
import pkg from '../package.json' with { type: 'json' };

export default defineConfig({
  ignoreDeadLinks: 'localhostLinks',
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
      {
        defer: '',
        'data-domain': 'ui.studiometa.dev',
        src: 'https://plausible.io/js/script.outbound-links.js',
      },
    ],
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/-/logo.png' }],
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
        url: withLeadingCharacters(item.url, '-/'),
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
        text: 'Components',
        link: '/components/',
      },
      {
        text: 'Demos',
        link: '/demos/',
      },
      {
        text: 'Playground',
        link: process.env.NODE_ENV === 'development' ? '/play/index.html' : '/play/',
        target: '_blank',
      },
      {
        text: `<span class="VPBadge font-bold bg-[var(--vp-button-brand-bg)] text-[var(--vp-button-brand-text)]">v${pkg.version}</span>`,
        items: [{ text: 'Release Notes', link: 'https://github.com/studiometa/ui/releases' }],
      },
    ],
    sidebar: {
      '/components/': getComponentsSidebar(),
      '/': getGuideSidebar(),
      '/demos/': await getDemoSidebar(),
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
      text: 'Components',
      items: generateSidebarLinksFromPath('components/*/index.md', {
        extractTitle: true,
        collapsed: true,
      }),
    },
  ];
}

async function getDemoSidebar() {
  return [
    {
      text: 'Demos',
      link: '/demos/',
      items: await getDemoItems(),
      collapsed: false,
    },
  ];
}

async function getDemoItems() {
  const data = await fetch(`https://ui.studiometa.dev/api/demos/`)
    .then((response) => response.json())
    .catch((error) => console.log(error));

  return data.map((el) => {
    return {
      text: el.title,
      lastUpdated: el.updated_at,
      link: '/demos/' + el.slug,
    };
  });
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
