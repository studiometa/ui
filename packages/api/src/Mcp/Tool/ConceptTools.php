<?php

namespace App\Mcp\Tool;

use App\Mcp\DocsRepository;
use Mcp\Capability\Attribute\McpTool;
use Mcp\Exception\ToolCallException;

/**
 * MCP tools exposing the @studiometa/ui Concepts documentation.
 */
final class ConceptTools
{
    public function __construct(
        private readonly DocsRepository $docs,
    ) {
    }

    /**
     * List the documented architectural concepts and their canonical paths.
     *
     * Use this before fetching a concept when you need to understand package
     * surfaces, the declarative runtime, composition or template customization.
     *
     * @return array{concepts: list<array{name: string, slug: string, path: string}>}
     */
    #[McpTool(name: 'list_concepts')]
    public function listConcepts(): array
    {
        try {
            return ['concepts' => $this->docs->listConcepts()];
        } catch (\RuntimeException $e) {
            throw new ToolCallException($e->getMessage(), previous: $e);
        }
    }

    /**
     * Get the canonical documentation for an architectural concept.
     *
     * @param string $name The concept name or slug, e.g. "Declarative runtime" or "composition"
     */
    #[McpTool(name: 'get_concept')]
    public function getConcept(string $name): string
    {
        try {
            return $this->docs->getConcept($name);
        } catch (\RuntimeException $e) {
            throw new ToolCallException($e->getMessage(), previous: $e);
        }
    }
}
