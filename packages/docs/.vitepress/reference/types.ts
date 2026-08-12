export const referenceKinds = ['component', 'primitive', 'decorator', 'helper'] as const;
export const referenceSymbolKinds = [
  'component',
  'primitive',
  'decorator',
  'helper',
  'constant',
  'type',
  'template',
] as const;
export const referenceSurfaces = ['js', 'twig', 'liquid'] as const;
export const referencePackages = [
  'npm:@studiometa/ui',
  'composer:studiometa/ui',
  'npm:@studiometa/ui-mapbox',
  'npm:@studiometa/ui-motion',
] as const;
export const referenceStatuses = ['stable', 'preview', 'deprecated'] as const;

export type ReferenceKind = (typeof referenceKinds)[number];
export type ReferenceSymbolKind = (typeof referenceSymbolKinds)[number];
export type ReferenceSurface = (typeof referenceSurfaces)[number];
export type ReferencePackage = (typeof referencePackages)[number];
export type ReferenceStatus = (typeof referenceStatuses)[number];

export interface ReferenceSymbol {
  name: string;
  kind: ReferenceSymbolKind;
  package: ReferencePackage;
  importPath?: string;
  href: string;
  status?: ReferenceStatus;
}

export interface ReferenceCatalogEntry {
  id: string;
  title: string;
  summary: string;
  kind: ReferenceKind;
  path: string;
  family?: string;
  primaryTask?: string;
  tags: string[];
  surfaces: ReferenceSurface[];
  packages: ReferencePackage[];
  status: ReferenceStatus;
  symbols: ReferenceSymbol[];
  aliases?: string[];
  capabilities?: string[];
  related?: string[];
}

export interface ReferenceCatalogFilters {
  query?: string;
  kinds?: ReferenceKind[];
  families?: string[];
  tags?: string[];
  surfaces?: ReferenceSurface[];
  packages?: ReferencePackage[];
  statuses?: ReferenceStatus[];
}

export type ReferenceCatalogGroup = 'family' | 'kind' | 'package' | 'status' | 'surface';
