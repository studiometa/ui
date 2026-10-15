/**
 * Builds the agent skill shipped in a package.
 *
 * Each published package holds a hand-written `skills/<name>/SKILL.md`. This
 * script validates it and generates its `references/` folder from the docs, so
 * the references always match the published version. The `skills` CLI links
 * the skill from `node_modules` with `npx skills experimental_sync`.
 *
 * Run it from a package directory: `node ../../scripts/build-skills.ts`.
 *
 * With `--well-known <directory>`, it builds every skill and publishes them in
 * `<directory>/.well-known/agent-skills/`: one archive per skill and the
 * `index.json` of the Agent Skills Discovery RFC, so
 * `npx skills add https://ui.studiometa.dev` installs them.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { referenceCatalog } from '../packages/docs/.vitepress/reference/catalog.ts';

const repositoryDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsDirectory = resolve(repositoryDirectory, 'packages/docs');
const docsUrl = 'https://ui.studiometa.dev';
const discoverySchema = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

interface SkillTarget {
  // Package directory, relative to the repository root.
  directory: string;
  // Skill name, also the name of its folder in `skills/`.
  name: string;
  // Docs catalog packages whose reference items go into the skill.
  catalogPackages: readonly string[];
  // Docs guide pages that go into the skill, relative to the docs root.
  guides: readonly string[];
}

const targets: Record<string, SkillTarget> = {
  '@studiometa/ui': {
    directory: 'packages/ui',
    name: 'studiometa-ui',
    catalogPackages: ['npm:@studiometa/ui', 'composer:studiometa/ui'],
    guides: [
      'guide/installation/index.md',
      'guide/usage/index.md',
      'guide/autoloading/index.md',
      'guide/concepts/index.md',
      'guide/concepts/composition.md',
      'guide/concepts/declarative-runtime.md',
      'guide/concepts/packages-and-surfaces.md',
      'guide/concepts/templates-and-customization.md',
    ],
  },
  '@studiometa/ui-mapbox': {
    directory: 'packages/ui-mapbox',
    name: 'studiometa-ui-mapbox',
    catalogPackages: ['npm:@studiometa/ui-mapbox'],
    guides: [],
  },
  '@studiometa/ui-motion': {
    directory: 'packages/ui-motion',
    name: 'studiometa-ui-motion',
    catalogPackages: ['npm:@studiometa/ui-motion'],
    guides: [],
  },
  '@studiometa/eslint-plugin-ui': {
    directory: 'packages/eslint-plugin-ui',
    name: 'studiometa-eslint-plugin-ui',
    catalogPackages: [],
    guides: ['guide/eslint-plugin/index.md'],
  },
};

interface Page {
  // Source file, relative to the docs root.
  source: string;
  // Output file, relative to the `references/` folder.
  output: string;
}

/**
 * Get the site path of a docs page, without extension and trailing slash.
 */
function toSitePath(path: string): string {
  return `/${path}`
    .replace(/\.(md|html)$/, '')
    .replace(/\/index$/, '')
    .replace(/\/$/, '');
}

function readField(frontmatter: string, key: string): string | undefined {
  return frontmatter.match(new RegExp(`^${key}: (.+)$`, 'm'))?.[1].trim();
}

/**
 * Read a docs snippet as a fenced code block.
 */
async function readSnippet(path: string, sourceDirectory: string): Promise<string[]> {
  const file = path.startsWith('@/')
    ? join(docsDirectory, path.slice(2))
    : resolve(sourceDirectory, path.replace(/\?.*$/, ''));
  const code = await readFile(file, 'utf8');
  return [`\`\`\`${extname(file).slice(1)}`, code.trimEnd(), '```', ''];
}

/**
 * Point a docs link to a page of the skill, or to the docs website.
 */
function rewriteLink(target: string, page: Page, pages: Map<string, string>): string {
  if (/^([a-z]+:|#)/.test(target)) {
    return target;
  }

  const [path, hash] = target.split('#');
  const sitePath = toSitePath(posix.resolve(posix.dirname(`/${page.source}`), path).slice(1));
  const reference = pages.get(sitePath);
  const suffix = hash ? `#${hash}` : '';

  if (reference) {
    return posix.relative(posix.dirname(page.output), reference) + suffix;
  }

  const isFolder = path === '' || /(\/|\/index(\.(md|html))?)$/.test(path);
  return `${docsUrl}${sitePath}${isFolder ? '/' : ''}${suffix}`;
}

/**
 * Check the `name` and `description` fields of a `SKILL.md` file and return the
 * description.
 */
function validateSkill(skillFile: string, name: string, content: string): string {
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
  if (!frontmatter) {
    throw new Error(`${skillFile}: missing frontmatter.`);
  }

  if (readField(frontmatter, 'name') !== name) {
    throw new Error(`${skillFile}: the "name" field must be "${name}", the name of its folder.`);
  }

  const description = readField(frontmatter, 'description') ?? '';
  if (description.length === 0 || description.length > 1024) {
    throw new Error(`${skillFile}: the "description" field must have 1 to 1024 characters.`);
  }

  return description;
}

/**
 * Turn a VitePress page into plain Markdown: keep the `<llm-only>` content,
 * drop the `<llm-exclude>` content, inline the `<<<` snippets and rewrite the
 * links to the other references or to the docs website.
 */
async function toReference(page: Page, pages: Map<string, string>): Promise<string> {
  const source = await readFile(join(docsDirectory, page.source), 'utf8');
  const sourceDirectory = dirname(join(docsDirectory, page.source));
  const lines = source.replace(/^---\n[\s\S]*?\n---\n/, '').split('\n');
  const output: string[] = [];
  let inFence = false;
  let inExclude = false;
  let preview: string[] | null = null;

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
    }

    if (inFence || /^\s*(```|~~~)/.test(line)) {
      if (!inExclude) {
        output.push(line);
      }
      continue;
    }

    if (/^\s*<llm-exclude>/.test(line)) {
      inExclude = !/<\/llm-exclude>/.test(line);
      continue;
    }

    if (inExclude) {
      inExclude = !/<\/llm-exclude>/.test(line);
      continue;
    }

    // A preview without an `<llm-only>` alternative: inline its source files.
    if (preview || /^\s*<PreviewPlayground\b/.test(line)) {
      preview = [...(preview ?? []), line];
      if (/\/>\s*$/.test(line)) {
        const imports = preview
          .join('\n')
          .matchAll(/:(?:html|script|css)="\(\) => import\('([^']+)'\)"/g);
        for (const [, path] of imports) {
          output.push(...(await readSnippet(path, sourceDirectory)));
        }
        preview = null;
      }
      continue;
    }

    if (/^\s*<\/?llm-only>\s*$/.test(line) || /^\s*:::\s*(code-group)?\s*$/.test(line)) {
      continue;
    }

    const container = line.match(/^\s*:::\s*(tip|info|warning|danger|details)\s*(.*)$/);
    if (container) {
      const [, type, title] = container;
      output.push(`**${title || type[0].toUpperCase() + type.slice(1)}**`, '');
      continue;
    }

    const snippet = line.match(/^\s*<<<\s+(\S+?)(\{[^}]*\})?(\s+\[.*\])?\s*$/);
    if (snippet) {
      output.push(...(await readSnippet(snippet[1], sourceDirectory)));
      continue;
    }

    output.push(
      line
        .replace(/\s*<Badges\b[^>]*\/>/g, '')
        .replace(
          /\]\(([^)\s]+)\)/g,
          (_, target: string) => `](${rewriteLink(target, page, pages)})`,
        ),
    );
  }

  const markdown = `${output
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`;
  const residue = markdown
    .replace(/^(```|~~~)[\s\S]*?^\1/gm, '')
    .match(/<\/?(llm-|PreviewPlayground|Badges|ReferenceIndex)|^\s*(<<<|:::)/m);

  if (residue) {
    throw new Error(`${page.source}: "${residue[0].trim()}" is left in the generated reference.`);
  }

  return markdown;
}

interface BuiltSkill {
  name: string;
  description: string;
  directory: string;
}

async function buildSkill(packageDirectory: string): Promise<BuiltSkill> {
  const pkg = JSON.parse(await readFile(join(packageDirectory, 'package.json'), 'utf8'));
  const target = targets[pkg.name];

  if (!target) {
    throw new Error(`No skill is configured for the "${pkg.name}" package.`);
  }

  if (!pkg.files?.includes('skills')) {
    throw new Error(`${pkg.name}: the "files" field must include "skills".`);
  }

  const skillDirectory = join(packageDirectory, 'skills', target.name);
  const skillFile = join(skillDirectory, 'SKILL.md');
  const description = validateSkill(
    relative(repositoryDirectory, skillFile),
    target.name,
    await readFile(skillFile, 'utf8'),
  );

  const entries = referenceCatalog.filter((entry) =>
    entry.packages.some((name) => target.catalogPackages.includes(name)),
  );
  const pages: Page[] = target.guides.map((source) => ({ source, output: source }));

  for (const entry of entries) {
    const itemDirectory = entry.path.replace(/^\/|\/$/g, '');
    if (!existsSync(join(docsDirectory, itemDirectory))) {
      throw new Error(`The "${entry.path}" docs folder of "${entry.title}" does not exist.`);
    }

    for (const file of await readdir(join(docsDirectory, itemDirectory))) {
      if (file.endsWith('.md')) {
        pages.push({
          source: `${itemDirectory}/${file}`,
          output: `items/${entry.title}/${file}`,
        });
      }
    }
  }

  const sitePaths = new Map(pages.map((page) => [toSitePath(page.source), page.output]));
  const referencesDirectory = join(skillDirectory, 'references');
  await rm(referencesDirectory, { recursive: true, force: true });

  for (const page of pages) {
    const file = join(referencesDirectory, page.output);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, await toReference(page, sitePaths));
  }

  if (entries.length > 0) {
    const rows = entries.map(
      (entry) =>
        `| [${entry.title}](items/${entry.title}/index.md) | ${entry.kind} | ${entry.summary} |`,
    );
    await writeFile(
      join(referencesDirectory, 'index.md'),
      [
        `# ${pkg.name} reference`,
        '',
        'Each item folder holds `index.md` (usage), `js-api.md` or `twig-api.md` (API) and `examples.md` when the docs have them.',
        '',
        '| Item | Kind | Summary |',
        '| --- | --- | --- |',
        ...rows,
        '',
      ].join('\n'),
    );
  }

  console.log(
    `Built the ${target.name} skill: ${pages.length} reference pages in ${relative(packageDirectory, referencesDirectory)}.`,
  );

  return { name: target.name, description, directory: skillDirectory };
}

/**
 * Build every skill and publish it as a `.tar.gz` archive with `SKILL.md` at
 * its root, listed in the `index.json` of the Agent Skills Discovery RFC.
 */
async function publishSkills(outputDirectory: string) {
  const wellKnownDirectory = join(outputDirectory, '.well-known/agent-skills');
  await rm(wellKnownDirectory, { recursive: true, force: true });
  await mkdir(wellKnownDirectory, { recursive: true });

  const skills = [];
  for (const target of Object.values(targets)) {
    const skill = await buildSkill(join(repositoryDirectory, target.directory));
    const archive = join(wellKnownDirectory, `${skill.name}.tar.gz`);
    // The ustar format and the bare paths are what the `skills` CLI reads: it
    // refuses `./` path segments and skips the GNU long name entries.
    execFileSync('tar', [
      '--format=ustar',
      '-czf',
      archive,
      '-C',
      skill.directory,
      'SKILL.md',
      'references',
    ]);
    const digest = createHash('sha256')
      .update(await readFile(archive))
      .digest('hex');
    skills.push({
      name: skill.name,
      type: 'archive',
      description: skill.description,
      url: `${skill.name}.tar.gz`,
      digest: `sha256:${digest}`,
    });
  }

  await writeFile(
    join(wellKnownDirectory, 'index.json'),
    `${JSON.stringify({ $schema: discoverySchema, skills }, null, 2)}\n`,
  );
  console.log(
    `Published ${skills.length} skills in ${relative(process.cwd(), wellKnownDirectory)}.`,
  );
}

const wellKnownFlag = process.argv.indexOf('--well-known');

if (wellKnownFlag === -1) {
  await buildSkill(process.cwd());
} else {
  const outputDirectory = process.argv[wellKnownFlag + 1];
  if (!outputDirectory) {
    throw new Error('The --well-known flag needs an output directory.');
  }
  await publishSkills(resolve(outputDirectory));
}
