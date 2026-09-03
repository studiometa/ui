import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { catalog as uiCatalog } from '../packages/ui/src/catalog.ts';
import { catalog as mapboxCatalog } from '../packages/ui-mapbox/src/catalog.ts';
import { catalog as motionCatalog } from '../packages/ui-motion/src/catalog.ts';
import type { ComponentCatalog, CuratedComponentMetadata } from './manifest-types.ts';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(scriptsDirectory, '..');
const checkOnly = process.argv.includes('--check');

interface PackageTarget {
  catalog: ComponentCatalog;
  // Directory holding the `package.json` manifest.
  packageDirectory: string;
  // Directory holding the `.ts` sources and the generated `manifest.ts`.
  sourceDirectory: string;
  manifestPath: string;
}

const targets: readonly PackageTarget[] = [
  {
    catalog: uiCatalog,
    packageDirectory: resolve(repositoryDirectory, 'packages/ui'),
    sourceDirectory: resolve(repositoryDirectory, 'packages/ui/src'),
    manifestPath: resolve(repositoryDirectory, 'packages/ui/src/manifest.ts'),
  },
  {
    catalog: mapboxCatalog,
    packageDirectory: resolve(repositoryDirectory, 'packages/ui-mapbox'),
    sourceDirectory: resolve(repositoryDirectory, 'packages/ui-mapbox/src'),
    manifestPath: resolve(repositoryDirectory, 'packages/ui-mapbox/src/manifest.ts'),
  },
  {
    catalog: motionCatalog,
    packageDirectory: resolve(repositoryDirectory, 'packages/ui-motion'),
    sourceDirectory: resolve(repositoryDirectory, 'packages/ui-motion/src'),
    manifestPath: resolve(repositoryDirectory, 'packages/ui-motion/src/manifest.ts'),
  },
];

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

type ExportEntry = string | { import: string; types?: string };

function exportImport(entry: ExportEntry): string {
  return typeof entry === 'string' ? entry : entry.import;
}

function exportTarget(
  packageJson: { exports: Record<string, ExportEntry> },
  subpath: string,
): string {
  const explicit = packageJson.exports[`./${subpath}`];
  const wildcard = packageJson.exports['./*'];
  const entry = explicit ?? wildcard;
  if (!entry) {
    throw new Error(`No export found for subpath ./${subpath}`);
  }
  const target = explicit ? exportImport(entry) : exportImport(entry).replace('*', subpath);
  // The published `@studiometa/ui-mapbox` maps subpaths to its built `dist/`
  // tree; the generated `manifest.ts` sits at the source root and, once built,
  // at the `dist/` root, so its `load()` specifiers must be relative to that
  // root — strip the leading `./dist/` segment to recover the sibling path.
  return target.replace(/^\.\/dist\//, './');
}

async function validateCatalog(target: PackageTarget) {
  const { catalog } = target;
  const packageJson = JSON.parse(
    await readFile(resolve(target.packageDirectory, 'package.json'), 'utf8'),
  );
  const publicClasses = await collectExportedClasses(resolve(target.sourceDirectory, 'index.ts'));
  const tokens = catalog.components.map(({ token }) => token);

  assertUnique(tokens, `${catalog.packageName} component tokens`);
  assertUnique(catalog.abstractExports, `${catalog.packageName} abstract exports`);

  const knownTokens = new Set(tokens);
  for (const { token, children = [] } of catalog.components) {
    for (const child of children) {
      if (!knownTokens.has(child)) {
        throw new Error(`Unknown recursive child ${child} referenced by ${token}`);
      }
    }
  }

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

function serializeComponent(
  catalog: ComponentCatalog,
  component: CuratedComponentMetadata,
  packageJson: { exports: Record<string, ExportEntry> },
) {
  const { strategy } = catalog;
  const { token } = component;
  const subpath = component.subpath ?? token;
  const exportName = component.exportName ?? token;
  const importPath = exportTarget(packageJson, subpath).replace(/\.ts$/, '.js');

  // js-toolkit v4 narrowed a manifest entry to what the registry actually
  // reads: the lazy importer and the mount strategy it should use before the
  // module is loaded. `token`, `packageName`, `subpath`, `exportName`, `group`,
  // `children`, `styles` and `integrations` were v3 fields with no runtime
  // consumer; they stay in the authoring catalog, which is where they belong.
  return `  ${JSON.stringify(token)}: {\n    mountStrategy: ${JSON.stringify(strategy)},\n    load: () => import(${JSON.stringify(importPath)}).then(({ ${exportName} }) => ${exportName}),\n  },`;
}

async function generateManifest(target: PackageTarget): Promise<string> {
  const packageJson = JSON.parse(
    await readFile(resolve(target.packageDirectory, 'package.json'), 'utf8'),
  );
  const entries = [...target.catalog.components]
    .sort((a, b) => a.token.localeCompare(b.token))
    .map((component) => serializeComponent(target.catalog, component, packageJson));

  const source = `// This file is generated by scripts/generate-manifests.ts. Do not edit.\nimport type { ComponentManifest } from '@studiometa/js-toolkit';\n\nexport const manifest: ComponentManifest = {\n${entries.join('\n')}\n};\n`;
  const prettierConfig = await resolveConfig(target.manifestPath);
  return format(source, { ...prettierConfig, parser: 'typescript', filepath: target.manifestPath });
}

/**
 * The eslint plugin's component-name list, from the same catalog the manifest
 * comes from.
 *
 * It used to be hand-maintained next to a comment asking the next person to
 * keep it in sync, and it drifted exactly as that invites: it still named
 * components v2 dropped and had never learned half the ones v1 shipped. The
 * rule it feeds names `@studiometa/ui` in its message, so only that catalog
 * belongs here — a `ui-motion` component is not "available in @studiometa/ui".
 */
const componentNamesPath = resolve(
  repositoryDirectory,
  'packages/eslint-plugin-ui/src/utils/component-names.ts',
);

async function generateComponentNames(): Promise<string> {
  const names = [
    ...new Set([...uiCatalog.components.map(({ token }) => token), ...uiCatalog.abstractExports]),
  ].sort();

  const source = `// This file is generated by scripts/generate-manifests.ts. Do not edit.\n\n/** Every component class \`${uiCatalog.packageName}\` exports. */\nexport const UI_COMPONENT_NAMES: ReadonlySet<string> = new Set([\n${names
    .map((name) => `  ${JSON.stringify(name)},`)
    .join('\n')}\n]);\n`;
  const prettierConfig = await resolveConfig(componentNamesPath);
  return format(source, {
    ...prettierConfig,
    parser: 'typescript',
    filepath: componentNamesPath,
  });
}

let stale = false;
for (const target of targets) {
  await validateCatalog(target);
  const generated = await generateManifest(target);
  if (checkOnly) {
    const current = await readFile(target.manifestPath, 'utf8').catch(() => '');
    if (current !== generated) {
      stale = true;
      console.error(
        `The generated manifest for ${target.catalog.packageName} is stale. Run npm run manifest:generate.`,
      );
    }
  } else {
    await writeFile(target.manifestPath, generated);
  }
}

const generatedNames = await generateComponentNames();
if (checkOnly) {
  const current = await readFile(componentNamesPath, 'utf8').catch(() => '');
  if (current !== generatedNames) {
    stale = true;
    console.error(
      'The generated component-name list for @studiometa/eslint-plugin-ui is stale. Run npm run manifest:generate.',
    );
  }
} else {
  await writeFile(componentNamesPath, generatedNames);
}

if (stale) {
  throw new Error('One or more generated files are stale. Run npm run manifest:generate.');
}
