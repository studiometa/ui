import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

function resolve(path) {
  // `fileURLToPath` decodes percent-escapes and normalises platform paths,
  // unlike `URL.pathname` which leaves `%20`/`/C:/…` and breaks `fs.*Sync`.
  return fileURLToPath(new URL(path, import.meta.url));
}

const root = resolve('../');
const uiRoot = resolve('../packages/ui/');
const distRoot = resolve('../dist/');

/**
 * List the component directories exposing a public `index.ts` entrypoint.
 *
 * These are the directories whose `index.ts` re-exports one or more component
 * modules, each of which is given its own explicit (non-pattern) `exports` key
 * so it resolves to the module itself rather than being swallowed by the greedy
 * `./*` wildcard used for deep-file imports (a single `*` matches across slashes
 * in Node's subpath patterns, so flat and deep-file resolution cannot share one
 * pattern).
 *
 * @returns {string[]}
 */
function listComponentDirs() {
  return fs
    .readdirSync(uiRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(`${uiRoot}/${name}/index.ts`))
    .sort();
}

/**
 * List the module files re-exported by a directory `index.ts`.
 *
 * Each directory's `index.ts` publicly re-exports its component modules via
 * `export … from './File.js'` specifiers (`export *`, `export { … }`,
 * `export type { … }`). This parses those specifiers to recover the exact set
 * of publicly exported files — main modules, sub-components and family members
 * alike. Files not re-exported there stay internal and get no subpath.
 *
 * @param   {string} dir
 * @returns {string[]}
 */
function listReexportedFiles(dir) {
  const source = fs.readFileSync(`${uiRoot}/${dir}/index.ts`, 'utf8');
  const files = new Set();
  const re = /from\s+['"]\.\/([^'"]+?)(?:\.js)?['"]/g;
  let match;
  while ((match = re.exec(source))) {
    files.add(match[1]);
  }
  return [...files].sort();
}

/**
 * Build the `exports` map for the published package.
 *
 * Mirrors the source `exports` map from `packages/ui/package.json` but points
 * at the emitted `.js`/`.d.ts` artefacts instead of the `.ts` sources. Every
 * path that resolves against the source package keeps resolving against the
 * published one:
 *
 * - `.`                              → the barrel index;
 * - `./<File>` / `.js`               → a flat top-level subpath per module
 *   re-exported by a directory `index.ts` — main components (`./Accordion` →
 *   `./Accordion/Accordion.js`), sub-components (`./AccordionItem` →
 *   `./Accordion/AccordionItem.js`) and family members (`./DataBind` →
 *   `./Data/DataBind.js`) alike (explicit keys so they win over the wildcard);
 * - `./<Component>/<File>` / `.js`   → deep imports of individual modules.
 *
 * @param   {string[]} componentDirs
 * @returns {Record<string, unknown>}
 */
function buildExports(componentDirs) {
  const exportsMap = {
    '.': { types: './index.d.ts', import: './index.js' },
  };

  // For each directory, emit one flat top-level subpath per module its
  // `index.ts` re-exports (`./<File>` → `./<Dir>/<File>.js`). This uniformly
  // covers main components, sub-components and family members; modules a
  // directory keeps internal (not re-exported) get no subpath.
  for (const dir of componentDirs) {
    for (const file of listReexportedFiles(dir)) {
      const base = `${dir}/${file}`;
      const target = { types: `./${base}.d.ts`, import: `./${base}.js` };
      exportsMap[`./${file}`] = target;
      exportsMap[`./${file}.js`] = target;
    }
  }

  // Pass-through exports for published non-JS assets that resolved before the
  // `exports` field existed and must keep resolving to the asset itself rather
  // than being rewritten to a `.js` module by the greedy `./*` wildcard below:
  //
  // - `./package.json` so tooling can read the package manifest;
  // - `./*.twig` so the 24 shipped Twig templates stay resolvable through
  //   package resolution (the literal `.twig` suffix makes the pattern more
  //   specific than `./*`, so it wins for `.twig` specifiers).
  //
  // These are pure assets, so both `import` and `types` point at the file.
  exportsMap['./package.json'] = './package.json';
  exportsMap['./*.twig'] = { types: './*.twig', import: './*.twig' };
  // NOTE: no `./*.svg` entry here — the SVG assets live under `packages/ui/svg/`
  // in the source tree but are not copied into `dist/`, so they were never
  // resolvable in the published package. The source `package.json` keeps its
  // `./*.svg` entry for in-repo consumers.
  // NOTE: no `./*.ts` entry here. The published `dist/` ships `.js` + `.d.ts`
  // only (no `.ts` source), so a `.ts` subpath has no target — it was never
  // resolvable in the published package. The source `package.json` keeps its
  // `./*.ts` entry because the in-repo `.ts` files are consumed directly.

  // Greedy wildcards for deep-file imports, e.g. `@studiometa/ui/Frame/types`.
  // The `.js`-extensioned variant is declared first so it takes precedence over
  // the extensionless one for `.js` specifiers.
  exportsMap['./*.js'] = { types: './*.d.ts', import: './*.js' };
  exportsMap['./*'] = { types: './*.d.ts', import: './*.js' };

  return exportsMap;
}

/**
 * Write the files consumed when publishing the `dist/` folder to NPM:
 *
 * - a `package.json` derived from the source one, with the entrypoints and
 *   `exports` map rewritten to point at the emitted `.js`/`.d.ts` files
 *   (the source ones resolve to `.ts` for in-repo consumption);
 * - the `README.md` and `LICENSE.md`, copied from the repository root.
 */
function writeDistPackage() {
  console.log('Writing dist/package.json...');
  const pkg = JSON.parse(fs.readFileSync(`${uiRoot}/package.json`, 'utf8'));

  pkg.main = 'index.js';
  pkg.types = 'index.d.ts';
  pkg.exports = buildExports(listComponentDirs());

  const json = `${JSON.stringify(pkg, null, 2)}\n`;
  fs.writeFileSync(`${distRoot}/package.json`, json);
  console.log(json);

  for (const file of ['LICENSE.md', 'README.md']) {
    const source = `${root}/${file}`;
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, `${distRoot}/${file}`);
    }
  }

  console.log('Done writing dist/package.json!');
}

writeDistPackage();
