export interface ConceptCatalogEntry {
  title: string;
  slug: string;
  path: string;
  summary: string;
  aliases?: string[];
}

export const conceptCatalog = [
  {
    title: 'Concepts overview',
    slug: 'index',
    path: '/guide/concepts/',
    summary: 'The library mental model, shared vocabulary and conceptual learning path.',
    aliases: ['mental model', 'glossary', 'data family'],
  },
  {
    title: 'Packages and surfaces',
    slug: 'packages-and-surfaces',
    path: '/guide/concepts/packages-and-surfaces',
    summary: 'Published packages, JavaScript, Twig and Liquid surfaces, imports and styling ownership.',
    aliases: ['npm', 'composer', 'twig', 'liquid', 'styling'],
  },
  {
    title: 'Declarative runtime',
    slug: 'declarative-runtime',
    path: '/guide/concepts/declarative-runtime',
    summary: 'Registration, data attributes, options, refs, events, lifecycle and application orchestration.',
    aliases: ['registerComponent', 'createApp', 'data-component', 'data-option', 'data-ref'],
  },
  {
    title: 'Composition',
    slug: 'composition',
    path: '/guide/concepts/composition',
    summary: 'Components, primitives, decorators, helpers, compound families and extension decisions.',
    aliases: ['family', 'compound component', 'decorator', 'primitive'],
  },
  {
    title: 'Templates and customization',
    slug: 'templates-and-customization',
    path: '/guide/concepts/templates-and-customization',
    summary: 'Twig parameters, blocks, attributes, namespaces, overrides and styling boundaries.',
    aliases: ['ui-pkg', 'svg-pkg', 'override', 'template namespace'],
  },
] as const satisfies readonly ConceptCatalogEntry[];
