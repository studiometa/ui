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
 * These map to the `@studiometa/ui/<Component>` subpaths and must be declared
 * as explicit (non-pattern) `exports` keys so they resolve to the directory
 * `index` module rather than being swallowed by the greedy `./*` wildcard used
 * for deep-file imports (a single `*` matches across slashes in Node's subpath
 * patterns, so dir-index and deep-file resolution cannot share one pattern).
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
 * List the member modules re-exported by a "family" directory `index.ts`.
 *
 * Family directories (e.g. `Data`, `decorators`, `Prefetch`) have no single
 * main module; their `index.ts` aggregates member modules via `export … from
 * './Member.js'` specifiers. This parses those specifiers to recover the exact
 * set of publicly exported members (modules not re-exported there stay internal
 * and get no subpath).
 *
 * @param   {string} dir
 * @returns {string[]}
 */
function listFamilyMembers(dir) {
  const source = fs.readFileSync(`${uiRoot}/${dir}/index.ts`, 'utf8');
  const members = new Set();
  const re = /from\s+['"]\.\/([^'"]+?)(?:\.js)?['"]/g;
  let match;
  while ((match = re.exec(source))) {
    members.add(match[1]);
  }
  return [...members].sort();
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
 * - `./<Component>` / `.js`          → the component main module (explicit keys
 *   so they win over the wildcard);
 * - `./<Member>` / `.js`             → a flat subpath per member of a "family"
 *   directory (`Data`, `decorators`, `Prefetch`), which has no main module;
 * - `./<Component>/<File>` / `.js`   → deep imports of individual modules.
 *
 * @param   {string[]} componentDirs
 * @returns {Record<string, unknown>}
 */
function buildExports(componentDirs) {
  const exportsMap = {
    '.': { types: './index.d.ts', import: './index.js' },
  };

  for (const dir of componentDirs) {
    // Point the component subpath at its main module (`<dir>/<dir>.js`) when the
    // component has one — the lean class module carrying the default export —
    // rather than the `index` barrel.
    if (fs.existsSync(`${uiRoot}/${dir}/${dir}.ts`)) {
      const base = `${dir}/${dir}`;
      const target = { types: `./${base}.d.ts`, import: `./${base}.js` };
      exportsMap[`./${dir}`] = target;
      exportsMap[`./${dir}.js`] = target;
      continue;
    }

    // "Family" directories (e.g. `Data`, `decorators`, `Prefetch`) have no
    // single main module — their `index.ts` only aggregates member modules.
    // Instead of a family-aggregate subpath, expose each exported member at its
    // own flat top-level subpath (e.g. `./DataBind` → `./Data/DataBind.js`).
    // The member list is read from the family `index.ts` re-export specifiers,
    // so only intentionally exported members get a subpath.
    for (const member of listFamilyMembers(dir)) {
      const base = `${dir}/${member}`;
      const target = { types: `./${base}.d.ts`, import: `./${base}.js` };
      exportsMap[`./${member}`] = target;
      exportsMap[`./${member}.js`] = target;
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
