import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { conceptCatalog } from '../.vitepress/concepts/catalog.ts';
import { allReferenceSymbols, referenceCatalog } from '../.vitepress/reference/catalog.ts';

const docsRoot = resolve(import.meta.dirname, '..');
const repositoryRoot = resolve(docsRoot, '../..');
const itemsRoot = resolve(docsRoot, 'reference/items');
const conceptsRoot = resolve(docsRoot, 'guide/concepts');
const errors: string[] = [];

function report(condition: unknown, message: string) {
  if (!condition) errors.push(message);
}

function duplicates(values: string[]) {
  const seen = new Set<string>();
  return [...new Set(values.filter((value) => (seen.has(value) ? true : !seen.add(value))))];
}

for (const duplicate of duplicates(referenceCatalog.map((entry) => entry.id))) {
  errors.push(`Duplicate reference id: ${duplicate}`);
}
for (const duplicate of duplicates(referenceCatalog.map((entry) => entry.path))) {
  errors.push(`Duplicate reference path: ${duplicate}`);
}
for (const duplicate of duplicates(
  allReferenceSymbols.map(
    (symbol) => `${symbol.package}:${symbol.name}:${symbol.importPath ?? ''}`,
  ),
)) {
  errors.push(`Duplicate reference symbol: ${duplicate}`);
}
for (const duplicate of duplicates(conceptCatalog.map((concept) => concept.slug))) {
  errors.push(`Duplicate concept slug: ${duplicate}`);
}
for (const duplicate of duplicates(conceptCatalog.map((concept) => concept.path))) {
  errors.push(`Duplicate concept path: ${duplicate}`);
}

const conceptFiles = readdirSync(conceptsRoot)
  .filter((file) => file.endsWith('.md'))
  .toSorted();
const catalogConceptFiles = conceptCatalog.map((concept) => `${concept.slug}.md`).toSorted();

for (const file of conceptFiles) {
  report(catalogConceptFiles.includes(file), `Unregistered concept page: ${file}`);
}
for (const file of catalogConceptFiles) {
  report(conceptFiles.includes(file), `Missing concept page: ${file}`);
}
for (const concept of conceptCatalog) {
  report(Boolean(concept.title.trim()), `Missing title for concept ${concept.slug}`);
  report(Boolean(concept.summary.trim()), `Missing summary for concept ${concept.slug}`);
  const expectedPath =
    concept.slug === 'index' ? '/guide/concepts/' : `/guide/concepts/${concept.slug}`;
  report(concept.path === expectedPath, `Non-canonical path for concept ${concept.slug}`);
}

const conceptsOverview = readFileSync(resolve(conceptsRoot, 'index.md'), 'utf8');
const usageGuide = readFileSync(resolve(docsRoot, 'guide/usage/index.md'), 'utf8');
report(/^### The Data family$/m.test(conceptsOverview), 'Missing legacy #the-data-family anchor');
report(
  /^## Registering components$/m.test(usageGuide),
  'Missing legacy #registering-components anchor',
);

const itemDirectories = readdirSync(itemsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .toSorted();
const catalogDirectories = referenceCatalog
  .map((entry) => entry.path.match(/^\/reference\/items\/([^/]+)\/$/)?.[1])
  .filter((entry): entry is string => Boolean(entry))
  .toSorted();

for (const directory of itemDirectories) {
  report(
    catalogDirectories.includes(directory),
    `Unregistered reference item directory: ${directory}`,
  );
}
for (const directory of catalogDirectories) {
  report(itemDirectories.includes(directory), `Missing reference item directory: ${directory}`);
  report(
    readdirSync(resolve(itemsRoot, directory)).includes('index.md'),
    `Missing index.md for reference item: ${directory}`,
  );
}

const entryIds = new Set(referenceCatalog.map((entry) => entry.id));
for (const entry of referenceCatalog) {
  report(Boolean(entry.summary.trim()), `Missing summary for ${entry.id}`);
  report(Boolean(entry.tags.length), `Missing tags for ${entry.id}`);
  report(Boolean(entry.surfaces.length), `Missing surfaces for ${entry.id}`);
  report(Boolean(entry.packages.length), `Missing packages for ${entry.id}`);
  report(Boolean(entry.symbols.length), `Missing symbols for ${entry.id}`);
  report(entry.kind !== 'component' || entry.primaryTask, `Missing primary task for ${entry.id}`);

  for (const related of entry.related ?? []) {
    report(entryIds.has(related), `Unknown related reference id ${related} in ${entry.id}`);
  }

  for (const symbol of entry.symbols) {
    if (!symbol.href.startsWith('/')) continue;
    const path = symbol.href.split(/[?#]/, 1)[0];
    const candidates = path.endsWith('/')
      ? [resolve(docsRoot, `.${path}index.md`)]
      : [resolve(docsRoot, `.${path}.md`), resolve(docsRoot, `.${path}/index.md`)];
    report(
      candidates.some((candidate) => existsSync(candidate)),
      `Missing documentation target ${symbol.href} for ${symbol.name}`,
    );
  }
}

for (const symbol of allReferenceSymbols) {
  if (!symbol.href.startsWith('/')) continue;
  const path = symbol.href.split(/[?#]/, 1)[0];
  const candidates = path.endsWith('/')
    ? [resolve(docsRoot, `.${path}index.md`)]
    : [resolve(docsRoot, `.${path}.md`), resolve(docsRoot, `.${path}/index.md`)];
  report(
    candidates.some((candidate) => existsSync(candidate)),
    `Missing documentation target ${symbol.href} for ${symbol.name}`,
  );
}

const uiPackage = JSON.parse(
  readFileSync(resolve(repositoryRoot, 'packages/ui/package.json'), 'utf8'),
) as { exports: Record<string, unknown> };
const explicitUiSubpaths = Object.keys(uiPackage.exports)
  .filter((key) => key.startsWith('./'))
  // `./manifest` is a generated autoloader component manifest and `./autoload` is a side-effect
  // entry that registers it — neither is a documented reference item, so both are excluded from the
  // subpath documentation check (like `./package.json`).
  .filter(
    (key) =>
      !key.includes('*') &&
      key !== './package.json' &&
      key !== './manifest' &&
      key !== './autoload' &&
      !key.endsWith('.js'),
  )
  .map((key) => key.slice(2));

for (const subpath of explicitUiSubpaths) {
  const expectedImportPath = `@studiometa/ui/${subpath}`;
  const documented = allReferenceSymbols.some(
    (symbol) =>
      symbol.package === 'npm:@studiometa/ui' &&
      (symbol.name === subpath || symbol.importPath === expectedImportPath),
  );
  report(documented, `Undocumented @studiometa/ui subpath: ${subpath}`);
}

const mapboxIndex = readFileSync(resolve(repositoryRoot, 'packages/ui-mapbox/src/index.ts'), 'utf8');
// Only whole-module (`export * from './X.js'`) re-exports map to a documented item; named
// re-exports (e.g. the dependency-injection helpers from `./dependencies.js`) are covered by the
// per-symbol export validation below.
const mapboxExports = [...mapboxIndex.matchAll(/export \* from '\.\/([^']+)\.js'/g)].map(
  (match) => match[1],
);
for (const exportedName of mapboxExports) {
  report(
    allReferenceSymbols.some(
      (symbol) => symbol.package === 'npm:@studiometa/ui-mapbox' && symbol.name === exportedName,
    ),
    `Undocumented @studiometa/ui-mapbox export: ${exportedName}`,
  );
}

const publicEntryPoints = [
  {
    path: resolve(repositoryRoot, 'packages/ui/src/index.ts'),
    package: 'npm:@studiometa/ui',
  },
  {
    path: resolve(repositoryRoot, 'packages/ui-mapbox/src/index.ts'),
    package: 'npm:@studiometa/ui-mapbox',
  },
] as const;
const program = ts.createProgram(
  publicEntryPoints.map((entry) => entry.path),
  {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    target: ts.ScriptTarget.ESNext,
  },
);
const checker = program.getTypeChecker();

for (const entryPoint of publicEntryPoints) {
  const sourceFile = program.getSourceFile(entryPoint.path);
  const moduleSymbol = sourceFile ? checker.getSymbolAtLocation(sourceFile) : undefined;
  report(moduleSymbol, `Could not inspect public entry point: ${entryPoint.path}`);
  if (!moduleSymbol) continue;

  for (const exportedSymbol of checker.getExportsOfModule(moduleSymbol)) {
    report(
      allReferenceSymbols.some(
        (symbol) => symbol.package === entryPoint.package && symbol.name === exportedSymbol.name,
      ),
      `Undocumented named export ${exportedSymbol.name} from ${entryPoint.package}`,
    );
  }
}

const markdownFiles: string[] = [];
function collectMarkdown(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory() && !['.vitepress', 'node_modules'].includes(entry.name)) {
      collectMarkdown(path);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      markdownFiles.push(path);
    }
  }
}
collectMarkdown(docsRoot);

for (const file of markdownFiles) {
  const content = readFileSync(file, 'utf8');
  // Ban legacy absolute `/components/…` doc-route links (the old site's component
  // pages), but allow `/reference/components/` and relative code paths like
  // `import.meta.glob('./components/*.ts')` — a leading `.` marks a filesystem glob,
  // never a legacy route.
  report(
    !/(?<!\/reference)(?<!\.)\/components\//.test(content),
    `Legacy /components/ link remains in ${file}`,
  );

  if (!file.includes('/migration-guides/')) {
    report(
      !/(?:atoms|molecules|organisms)\//.test(content),
      `Atomic-design path remains in ${file}`,
    );
    report(
      !/\{%\s*(?:include|embed)\s+['"]@ui-pkg\//.test(content),
      `Package-only namespace used for a normal include in ${file}`,
    );
    for (const phrase of [
      'JavaScript and Vue parts',
      'Using Vue components',
      'Twig or Vue project',
    ]) {
      report(!content.includes(phrase), `Legacy phrase "${phrase}" remains in ${file}`);
    }
  }
}

if (errors.length) {
  console.error(`Documentation validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Documentation validation passed: ${referenceCatalog.length} Reference entries, ${allReferenceSymbols.length} symbols and ${conceptCatalog.length} concepts.`,
  );
}
