import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Read a JSON file.
 * @param   {string} path
 * @returns {any}
 */
function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url).pathname, { encoding: 'utf-8' }));
}

/**
 * Write a JSON file.
 * @param   {string} path
 * @param   {any} value
 * @returns {void}
 */
function writeJson(path, value) {
  return writeFileSync(
    new URL(path, import.meta.url).pathname,
    `${JSON.stringify(value, null, 2)}\n`,
    { encoding: 'utf-8' }
  );
}

console.log('Updating `composer.json` version...');
const pkg = readJson('../package.json');
const composer = readJson('../composer.json');
composer.version = pkg.version;
writeJson('../composer.json', composer);
console.log(`Updated \`composer.json\` to v${composer.version}.\n`);
