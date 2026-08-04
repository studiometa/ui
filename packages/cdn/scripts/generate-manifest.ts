import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { componentCatalogs } from '../src/component-metadata.ts';
import type { ComponentCatalog, CuratedComponentMetadata } from '../src/component-metadata.ts';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(scriptsDirectory, '..');
const repositoryDirectory = resolve(packageDirectory, '../..');
const generatedManifestPath = resolve(packageDirectory, 'src/manifest.generated.ts');
const checkOnly = process.argv.includes('--check');

const packageDirectories = {
  '@studiometa/ui': resolve(repositoryDirectory, 'packages/ui'),
  '@studiometa/ui-mapbox': resolve(repositoryDirectory, 'packages/ui-mapbox'),
} as const;

async function collectExportedClasses(entryPath: string, visited = new Set<string>()) {
  if (visited.has(entryPath)) return new Set<string>();
  visited.add(entryPath);

  const source = await readFile(entryPath, 'utf8');
  const classes = new Set<string>();
  const classPattern = /export\s+(?:default\s+)?(?:abstract\s+)?class\s+(\w+)/g;
  const reexportPatterns = [
    /export\s+\*\s+from\s+['"](.+?)['"]/g,
    /export\s+\{[^}]*\}\s+from\s+['"](.+?)['"]/gs,
  ];

  for (const match of source.matchAll(classPattern)) {
    classes.add(match[1]);
  }

  for (const pattern of reexportPatterns) {
    for (const match of source.matchAll(pattern)) {
      if (!match[1].startsWith('.')) continue;
      const importedPath = resolve(dirname(entryPath), match[1].replace(/\.js$/, '.ts'));
      const importedClasses = await collectExportedClasses(importedPath, visited);
      for (const className of importedClasses) classes.add(className);
    }
  }

  return classes;
}

function assertUnique(values: readonly string[], label: string) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate ${label}: ${[...new Set(duplicates)].join(', ')}`);
  }
}

async function validateCatalog(catalog: ComponentCatalog) {
  const packageDirectoryPath = packageDirectories[catalog.packageName];
  const packageJson = JSON.parse(
    await readFile(resolve(packageDirectoryPath, 'package.json'), 'utf8'),
  );
  const publicClasses = await collectExportedClasses(resolve(packageDirectoryPath, 'index.ts'));
  const tokens = catalog.components.map(({ token }) => token);

  assertUnique(tokens, `${catalog.packageName} component tokens`);
  assertUnique(catalog.abstractExports, `${catalog.packageName} abstract exports`);

  for (const component of catalog.components) {
    const subpath = component.subpath ?? component.token;
    const exportName = component.exportName ?? component.token;
    if (!publicClasses.has(exportName)) {
      throw new Error(`${catalog.packageName} does not publicly export class ${exportName}`);
    }
    if (!packageJson.exports[`./${subpath}`] && !packageJson.exports['./*']) {
      throw new Error(`${catalog.packageName} does not export subpath ./${subpath}`);
    }
  }

  const classifiedClasses = [...tokens, ...catalog.abstractExports].sort();
  const expectedClasses = [...publicClasses].sort();
  if (JSON.stringify(classifiedClasses) !== JSON.stringify(expectedClasses)) {
    const missing = expectedClasses.filter((name) => !classifiedClasses.includes(name));
    const unknown = classifiedClasses.filter((name) => !expectedClasses.includes(name));
    throw new Error(
      [
        `Incomplete public constructor classification for ${catalog.packageName}.`,
        missing.length > 0 ? `Missing: ${missing.join(', ')}.` : '',
        unknown.length > 0 ? `Unknown: ${unknown.join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    );
  }
}

function serializeArrayProperty(name: string, values: readonly string[] | undefined) {
  return values ? `\n    ${name}: ${JSON.stringify(values)},` : '';
}

function serializeComponent(catalog: ComponentCatalog, component: CuratedComponentMetadata) {
  const { packageName, strategy } = catalog;
  const { token, group, children, styles, integrations } = component;
  const subpath = component.subpath ?? token;
  const exportName = component.exportName ?? token;
  const importPath = `${packageName}/${subpath}`;

  return `  ${JSON.stringify(token)}: {\n    token: ${JSON.stringify(token)},\n    packageName: ${JSON.stringify(packageName)},\n    subpath: ${JSON.stringify(subpath)},\n    exportName: ${JSON.stringify(exportName)},\n    strategy: ${JSON.stringify(strategy)},\n    group: ${JSON.stringify(group)},${serializeArrayProperty('children', children)}${serializeArrayProperty('styles', styles)}${serializeArrayProperty('integrations', integrations)}\n    load: () => import(${JSON.stringify(importPath)}).then(({ ${exportName} }) => ${exportName}),\n  },`;
}

function generateManifest() {
  const entries = componentCatalogs.flatMap((catalog) =>
    [...catalog.components]
      .sort((a, b) => a.token.localeCompare(b.token))
      .map((component) => serializeComponent(catalog, component)),
  );

  return `// This file is generated by scripts/generate-manifest.ts. Do not edit.\nimport type { ComponentManifestEntry } from './manifest.js';\n\nexport const componentManifest: Record<string, ComponentManifestEntry> = {\n${entries.join('\n')}\n};\n`;
}

for (const catalog of componentCatalogs) await validateCatalog(catalog);
assertUnique(
  componentCatalogs.flatMap(({ components }) => components.map(({ token }) => token)),
  'global component tokens',
);

const knownTokens = new Set(
  componentCatalogs.flatMap(({ components }) => components.map(({ token }) => token)),
);
for (const { components } of componentCatalogs) {
  for (const { token, children = [] } of components) {
    for (const child of children) {
      if (!knownTokens.has(child)) {
        throw new Error(`Unknown recursive child ${child} referenced by ${token}`);
      }
    }
  }
}

const generatedManifest = generateManifest();
if (checkOnly) {
  const currentManifest = await readFile(generatedManifestPath, 'utf8').catch(() => '');
  if (currentManifest !== generatedManifest) {
    throw new Error(
      'The generated component manifest is stale. Run npm run cdn:manifest:generate.',
    );
  }
} else {
  await writeFile(generatedManifestPath, generatedManifest);
}
