<?php

namespace App\Mcp\Tool;

use App\Mcp\DocsRepository;
use Mcp\Capability\Attribute\McpTool;
use Mcp\Exception\ToolCallException;

/**
 * MCP tools exposing the @studiometa/ui component documentation.
 */
final class ComponentTools
{
    public function __construct(
        private readonly DocsRepository $docs,
    ) {
    }

    /**
     * List every @studiometa/ui component with the documentation pages
     * available for each one (e.g. twig-api.md, js-api.md, examples.md).
     *
     * Use this first to discover which components exist and how they are named
     * before fetching their API or examples.
     *
     * @return list<array{name: string, slug: string, pages: list<string>}>
     */
    #[McpTool(name: 'list_components')]
    public function listComponents(): array
    {
        try {
            return $this->docs->listComponents();
        } catch (\RuntimeException $e) {
            throw new ToolCallException($e->getMessage(), previous: $e);
        }
    }

    /**
     * Get the API documentation of a component: its Twig parameters and blocks,
     * and, for JavaScript components, its options, refs and events.
     *
     * @param string $name The component name, e.g. "Accordion" or "Slider" (case-insensitive)
     */
    #[McpTool(name: 'get_component_api')]
    public function getComponentApi(string $name): string
    {
        try {
            return $this->docs->getComponentApi($name);
        } catch (\RuntimeException $e) {
            throw new ToolCallException($e->getMessage(), previous: $e);
        }
    }

    /**
     * Get usage examples for a component as ready-to-use Twig and JavaScript
     * snippets. Ideal as the starting point for a playground.
     *
     * @param string $name The component name, e.g. "Accordion" or "Slider" (case-insensitive)
     */
    #[McpTool(name: 'get_component_example')]
    public function getComponentExample(string $name): string
    {
        try {
            return $this->docs->getComponentExample($name);
        } catch (\RuntimeException $e) {
            throw new ToolCallException($e->getMessage(), previous: $e);
        }
    }
}
