import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { defineConfig } from 'vitepress';
import {
  withLeadingSlash,
  withLeadingCharacters,
} from '@studiometa/js-toolkit/utils';
import glob from 'fast-glob';
import { loadEnv } from 'vitepress';

const env = loadEnv('', process.cwd());
const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), { encoding: 'utf8' }),
);

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
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  let final_data = [];
  const url = env.APP_URL ?? 'http://ui.ddev.site';

  await fetch(`${url}/api/demos/`)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      final_data = data.map((el) => {
        return {
          text: el.title,
          lastUpdated: el.updated_at,
          link: '/demos/' + el.slug,
        }
      });
    })
    .catch((error) => {
      console.log(error);
    });

  return final_data;
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
