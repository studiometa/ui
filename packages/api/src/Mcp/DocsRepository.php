<?php

namespace App\Mcp;

/**
 * Reads component documentation from the built VitePress output.
 *
 * The docs build (`vitepress-plugin-llms`) emits an `llms.txt` index and one
 * LLM-friendly Markdown file per page (`/components/<Slug>.md`,
 * `/components/<Slug>/twig-api.md`, ...). This repository is a thin reader over
 * those artifacts so the MCP tools carry no duplicated knowledge: whenever the
 * docs are rebuilt, the tools reflect the new content for free.
 */
final class DocsRepository
{
    /**
     * @var array<string, string>|null Map of lower-cased component name/slug to on-disk slug.
     */
    private ?array $slugMap = null;

    public function __construct(
        private readonly string $docsDistDir,
    ) {
    }

    /**
     * List every documented component with the doc pages available for it.
     *
     * @return list<array{name: string, slug: string, pages: list<string>}>
     */
    public function listComponents(): array
    {
        $components = [];

        foreach ($this->parseIndex() as $name => $slug) {
            $components[] = [
                'name' => $name,
                'slug' => $slug,
                'pages' => $this->availablePages($slug),
            ];
        }

        return $components;
    }

    /**
     * Return the API documentation for a component.
     *
     * Prefers the Twig API (playgrounds are Twig-first) and appends the JS API
     * when present, so JS-only components still return something useful.
     */
    public function getComponentApi(string $name): string
    {
        $slug = $this->resolveSlug($name);

        $parts = [];
        foreach (['twig-api.md', 'js-api.md'] as $page) {
            $content = $this->readPage("$slug/$page");
            if (null !== $content) {
                $parts[] = $content;
            }
        }

        if ([] === $parts) {
            throw new \RuntimeException(\sprintf(
                'No API documentation found for "%s". Available pages: %s.',
                $name,
                implode(', ', $this->availablePages($slug)) ?: 'none',
            ));
        }

        return implode("\n\n", $parts);
    }

    /**
     * Return the usage examples (Twig + JS snippets) for a component.
     */
    public function getComponentExample(string $name): string
    {
        $slug = $this->resolveSlug($name);
        $content = $this->readPage("$slug/examples.md");

        if (null === $content) {
            throw new \RuntimeException(\sprintf(
                'No examples found for "%s". Available pages: %s.',
                $name,
                implode(', ', $this->availablePages($slug)) ?: 'none',
            ));
        }

        return $content;
    }

    /**
     * Resolve a component name (or slug) to its on-disk slug, case-insensitively.
     */
    public function resolveSlug(string $name): string
    {
        $key = strtolower(trim($name));
        $map = $this->slugMap();

        if (!isset($map[$key])) {
            throw new \RuntimeException(\sprintf('Unknown component "%s".', $name));
        }

        return $map[$key];
    }

    /**
     * Parse the component index from `llms.txt`.
     *
     * @return array<string, string> Map of component name to on-disk slug.
     */
    private function parseIndex(): array
    {
        $index = $this->docsDistDir.'/llms.txt';
        if (!is_file($index)) {
            throw new \RuntimeException(\sprintf(
                'Documentation index not found at "%s". Build the docs first (npm run docs:build).',
                $index,
            ));
        }

        $components = [];
        $lines = file($index, \FILE_IGNORE_NEW_LINES) ?: [];

        // Component index pages are the only links shaped `/components/<slug>.md`
        // (sub-pages live under `/components/<slug>/...`), so this pattern alone
        // isolates them without tracking the current heading.
        foreach ($lines as $line) {
            if (1 === preg_match('#^- \[(?<label>.+?)\]\(/components/(?<slug>[^/)]+)\.md\)#', $line, $m)) {
                $name = trim(preg_replace('/<[^>]+>/', '', $m['label']) ?? '');
                $components[$name] = $m['slug'];
            }
        }

        if ([] === $components) {
            throw new \RuntimeException('No components found in the documentation index.');
        }

        return $components;
    }

    /**
     * @return array<string, string>
     */
    private function slugMap(): array
    {
        if (null !== $this->slugMap) {
            return $this->slugMap;
        }

        $map = [];
        foreach ($this->parseIndex() as $name => $slug) {
            $map[strtolower($name)] = $slug;
            $map[strtolower($slug)] = $slug;
        }

        return $this->slugMap = $map;
    }

    /**
     * @return list<string>
     */
    private function availablePages(string $slug): array
    {
        $dir = $this->docsDistDir.'/components/'.$slug;
        if (!is_dir($dir)) {
            return [];
        }

        $pages = [];
        foreach (glob($dir.'/*.md') ?: [] as $file) {
            $pages[] = basename($file);
        }
        sort($pages);

        return $pages;
    }

    /**
     * Read a docs page and normalize it for LLM consumption.
     *
     * The built Markdown is already LLM-oriented (the plugin resolves the
     * `<llm-only>` / `<llm-exclude>` blocks at build time); only the YAML
     * frontmatter and the `<Badges ... />` heading widget remain to strip.
     */
    private function readPage(string $relativePath): ?string
    {
        $path = $this->docsDistDir.'/components/'.$relativePath;
        if (!is_file($path)) {
            return null;
        }

        $content = file_get_contents($path);
        if (false === $content) {
            return null;
        }

        // Drop the leading YAML frontmatter block.
        $content = preg_replace('/\A---\n.*?\n---\n+/s', '', $content) ?? $content;
        // Drop the `<Badges ... />` widget left in headings.
        $content = preg_replace('/\s*<Badges\b[^>]*\/>/', '', $content) ?? $content;

        return trim($content);
    }
}
