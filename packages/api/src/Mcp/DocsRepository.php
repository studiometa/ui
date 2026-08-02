<?php

namespace App\Mcp;

/**
 * Reads Reference and Concepts documentation from the built VitePress output.
 *
 * The docs build (`vitepress-plugin-llms`) emits an `llms.txt` index and one
 * LLM-friendly Markdown file per page. This repository is a thin reader over
 * those artifacts so the MCP tools carry no duplicated knowledge: whenever the
 * docs are rebuilt, the tools reflect the new content for free.
 */
final class DocsRepository
{
    /**
     * @var array<string, string>|null Map of exact Reference item name/slug to on-disk slug.
     */
    private ?array $slugMap = null;

    /**
     * @var array<string, string>|null Map of exact concept name/slug to on-disk slug.
     */
    private ?array $conceptSlugMap = null;

    public function __construct(
        private readonly string $docsDistDir,
    ) {
    }

    /**
     * List every documented Reference item with the doc pages available for it.
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
     * List every documented concept.
     *
     * @return list<array{name: string, slug: string, path: string}>
     */
    public function listConcepts(): array
    {
        $concepts = [];

        foreach ($this->parseConceptIndex() as $name => $slug) {
            $concepts[] = [
                'name' => $name,
                'slug' => $slug,
                'path' => 'index' === $slug ? '/guide/concepts/' : "/guide/concepts/$slug",
            ];
        }

        return $concepts;
    }

    /**
     * Return the canonical documentation for a concept.
     */
    public function getConcept(string $name): string
    {
        $slug = $this->resolveConceptSlug($name);
        $path = 'index' === $slug
            ? $this->docsDistDir.'/guide/concepts.md'
            : $this->docsDistDir."/guide/concepts/$slug.md";
        $content = $this->readMarkdown($path);

        if (null === $content) {
            throw new \RuntimeException(\sprintf('No documentation found for concept "%s".', $name));
        }

        return $content;
    }

    /**
     * Return the API or canonical usage documentation for a Reference item.
     *
     * Prefers the Twig API (playgrounds are Twig-first) and appends the JS API
     * when present. Items without dedicated API pages return their overview.
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
            $content = $this->readPage("$slug/index.md");
            if (null !== $content) {
                $parts[] = $content;
            }
        }

        if ([] === $parts) {
            throw new \RuntimeException(\sprintf(
                'No documentation found for "%s". Available pages: %s.',
                $name,
                implode(', ', $this->availablePages($slug)) ?: 'none',
            ));
        }

        return implode("\n\n", $parts);
    }

    /**
     * Return examples or canonical usage documentation for a Reference item.
     */
    public function getComponentExample(string $name): string
    {
        $slug = $this->resolveSlug($name);
        $content = $this->readPage("$slug/examples.md");

        if (null === $content) {
            $content = $this->readPage("$slug/index.md");
        }

        if (null === $content) {
            throw new \RuntimeException(\sprintf(
                'No examples or usage documentation found for "%s". Available pages: %s.',
                $name,
                implode(', ', $this->availablePages($slug)) ?: 'none',
            ));
        }

        return $content;
    }

    /**
     * Resolve a Reference item name (or slug) to its on-disk slug, case-insensitively.
     */
    public function resolveSlug(string $name): string
    {
        $key = trim($name);
        $map = $this->slugMap();

        if (isset($map[$key])) {
            return $map[$key];
        }

        $matches = [];
        foreach ($map as $alias => $slug) {
            if (0 === strcasecmp($alias, $key)) {
                $matches[$slug] = true;
            }
        }

        if (1 === count($matches)) {
            return array_key_first($matches);
        }

        if (count($matches) > 1) {
            throw new \RuntimeException(\sprintf(
                'Ambiguous Reference item "%s". Use its exact casing.',
                $name,
            ));
        }

        throw new \RuntimeException(\sprintf('Unknown Reference item "%s".', $name));
    }

    /**
     * Resolve a concept name or slug case-insensitively.
     */
    public function resolveConceptSlug(string $name): string
    {
        $key = trim($name);
        $map = $this->conceptSlugMap();

        if (isset($map[$key])) {
            return $map[$key];
        }

        foreach ($map as $alias => $slug) {
            if (0 === strcasecmp($alias, $key)) {
                return $slug;
            }
        }

        throw new \RuntimeException(\sprintf('Unknown concept "%s".', $name));
    }

    /**
     * Parse every Reference item from `llms.txt`.
     *
     * @return array<string, string> Map of Reference item name to on-disk slug.
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

        foreach ($lines as $line) {
            if (1 === preg_match('#^- \[(?<label>.+?)\]\(/reference/items/(?<slug>[^/)]+)\.md\)#', $line, $m)) {
                $name = trim(preg_replace('/<[^>]+>/', '', $m['label']) ?? '');
                $components[$name] = $m['slug'];
            }
        }

        if ([] === $components) {
            throw new \RuntimeException('No Reference items found in the documentation index.');
        }

        return $components;
    }

    /**
     * Parse every concept from `llms.txt`.
     *
     * @return array<string, string> Map of concept name to on-disk slug.
     */
    private function parseConceptIndex(): array
    {
        $index = $this->docsDistDir.'/llms.txt';
        if (!is_file($index)) {
            throw new \RuntimeException(\sprintf(
                'Documentation index not found at "%s". Build the docs first (npm run docs:build).',
                $index,
            ));
        }

        $concepts = [];
        $lines = file($index, \FILE_IGNORE_NEW_LINES) ?: [];

        foreach ($lines as $line) {
            if (1 === preg_match('#^- \[(?<label>.+?)\]\(/guide/concepts(?:/(?<slug>[^/)]+))?\.md\)#', $line, $m)) {
                $name = trim(preg_replace('/<[^>]+>/', '', $m['label']) ?? '');
                $concepts[$name] = ($m['slug'] ?? '') ?: 'index';
            }
        }

        if ([] === $concepts) {
            throw new \RuntimeException('No concepts found in the documentation index.');
        }

        return $concepts;
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
            $map[$name] = $slug;
            $map[$slug] = $slug;
        }

        return $this->slugMap = $map;
    }

    /**
     * @return array<string, string>
     */
    private function conceptSlugMap(): array
    {
        if (null !== $this->conceptSlugMap) {
            return $this->conceptSlugMap;
        }

        $map = [];
        foreach ($this->parseConceptIndex() as $name => $slug) {
            $map[$name] = $slug;
            $map[$slug] = $slug;
        }

        return $this->conceptSlugMap = $map;
    }

    /**
     * @return list<string>
     */
    private function availablePages(string $slug): array
    {
        $dir = $this->docsDistDir.'/reference/items/'.$slug;
        $pages = [];

        if (is_file($this->docsDistDir.'/reference/items/'.$slug.'.md')) {
            $pages[] = 'index.md';
        }

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
        $path = str_ends_with($relativePath, '/index.md')
            ? $this->docsDistDir.'/reference/items/'.substr($relativePath, 0, -9).'.md'
            : $this->docsDistDir.'/reference/items/'.$relativePath;

        return $this->readMarkdown($path);
    }

    /**
     * Read and normalize a built Markdown file for LLM consumption.
     */
    private function readMarkdown(string $path): ?string
    {
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
