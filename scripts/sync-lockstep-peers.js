import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Keep the exact-pinned, lockstep peer dependencies of `@studiometa/ui-autoload` in sync with the
 * repository version. `@studiometa/ui`, `@studiometa/ui-mapbox` and `@studiometa/ui-autoload` are
 * always published together at the same version, so ui-autoload pins its ui/ui-mapbox peers to the
 * EXACT version rather than a range. `npm version --workspaces` bumps the `version` fields but does
 * not rewrite cross-workspace dependency ranges, so this script rewrites those exact pins after a
 * bump (wired into the root `postversion` script alongside `update-composer-version.js`).
 */

/** Internal packages pinned to the exact repository version wherever ui-autoload declares them. */
const LOCKSTEP_PACKAGES = ['@studiometa/ui', '@studiometa/ui-mapbox'];

/**
 * Read a JSON file relative to this script.
 * @param   {string} path
 * @returns {any}
 */
function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url).pathname, { encoding: 'utf-8' }));
}

/**
 * Write a JSON file relative to this script.
 * @param   {string} path
 * @param   {any} value
 * @returns {void}
 */
function writeJson(path, value) {
  return writeFileSync(
    new URL(path, import.meta.url).pathname,
    `${JSON.stringify(value, null, 2)}\n`,
    {
      encoding: 'utf-8',
    },
  );
}

const { version } = readJson('../package.json');
const path = '../packages/ui-autoload/package.json';
const pkg = readJson(path);

console.log('Syncing @studiometa/ui-autoload lockstep peer dependencies...');
let changed = false;
for (const name of LOCKSTEP_PACKAGES) {
  if (pkg.peerDependencies?.[name] && pkg.peerDependencies[name] !== version) {
    pkg.peerDependencies[name] = version;
    changed = true;
  }
}

if (changed) {
  writeJson(path, pkg);
  console.log(`Pinned ${LOCKSTEP_PACKAGES.join(', ')} to v${version}.\n`);
} else {
  console.log(`Already at v${version}.\n`);
}
