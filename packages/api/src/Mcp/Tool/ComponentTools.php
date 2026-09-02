<?php

namespace App\Mcp\Tool;

use App\Mcp\DocsRepository;
use Mcp\Capability\Attribute\McpTool;
use Mcp\Exception\ToolCallException;

/**
 * MCP tools exposing the @studiometa/ui Reference documentation.
 */
final class ComponentTools
{
    public function __construct(
        private readonly DocsRepository $docs,
    ) {
    }

    /**
     * List every documented component, primitive, decorator and helper with
     * the pages available for each one (e.g. index.md, twig-api.md, js-api.md,
     * examples.md).
     *
     * Use this first to discover which Reference items exist and how they are
     * named before fetching their API or examples.
     *
     * @return array{items: list<array{name: string, slug: string, pages: list<string>}>}
     */
    #[McpTool(name: 'list_reference_items')]
    public function listReferenceItems(): array
    {
        try {
            // Wrap in an object: MCP requires tool structured content to be a
            // record, not a bare array.
            return ['items' => $this->docs->listComponents()];
        } catch (\RuntimeException $e) {
            throw new ToolCallException($e->getMessage(), previous: $e);
        }
    }

    /**
     * Backwards-compatible alias for list_reference_items.
     *
     * @return array{components: list<array{name: string, slug: string, pages: list<string>}>}
     */
    #[McpTool(name: 'list_components')]
    public function listComponents(): array
    {
        return ['components' => $this->listReferenceItems()['items']];
    }

    /**
     * Get the API documentation of a Reference item. For items without a
     * dedicated API page, return the canonical overview and usage documentation.
     *
     * @param string $name The item name, e.g. "Disclosure" or "withTransition" (case-insensitive when unambiguous)
     */
    #[McpTool(name: 'get_reference_item')]
    public function getReferenceItem(string $name): string
    {
        try {
            return $this->docs->getComponentApi($name);
        } catch (\RuntimeException $e) {
            throw new ToolCallException($e->getMessage(), previous: $e);
        }
    }

    /**
     * Backwards-compatible alias for get_reference_item.
     *
     * @param string $name The Reference item name (case-insensitive when unambiguous)
     */
    #[McpTool(name: 'get_component_api')]
    public function getComponentApi(string $name): string
    {
        return $this->getReferenceItem($name);
    }

    /**
     * Get examples for a Reference item as ready-to-use Twig and JavaScript
     * snippets. When no examples page exists, return its canonical usage page.
     *
     * @param string $name The item name, e.g. "Disclosure" or "withTransition" (case-insensitive when unambiguous)
     */
    #[McpTool(name: 'get_reference_item_examples')]
    public function getReferenceItemExamples(string $name): string
    {
        try {
            return $this->docs->getComponentExample($name);
        } catch (\RuntimeException $e) {
            throw new ToolCallException($e->getMessage(), previous: $e);
        }
    }

    /**
     * Backwards-compatible alias for get_reference_item_examples.
     *
     * @param string $name The Reference item name (case-insensitive when unambiguous)
     */
    #[McpTool(name: 'get_component_example')]
    public function getComponentExample(string $name): string
    {
        return $this->getReferenceItemExamples($name);
    }
}
