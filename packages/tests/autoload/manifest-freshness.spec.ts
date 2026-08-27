import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Running the generator is a repository check, not a component one, so it lives
// apart from the manifest assertions that have to load the barrel in a browser.

const repositoryDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('manifest generation', () => {
  it('keeps the committed manifests fresh', () => {
    const generator = resolve(repositoryDirectory, 'scripts/generate-manifests.ts');
    expect(() => execFileSync(process.execPath, [generator, '--check'])).not.toThrow();
  });
});
