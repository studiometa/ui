<?php

namespace App\Mcp\Tool;

use App\Mcp\PlaygroundUrlBuilder;
use Mcp\Capability\Attribute\McpTool;
use Mcp\Exception\ToolCallException;

/**
 * MCP tools generating @studiometa/ui playgrounds.
 */
final class PlaygroundTools
{
    public function __construct(
        private readonly PlaygroundUrlBuilder $urlBuilder,
    ) {
    }

    /**
     * Build a shareable playground URL from Twig/HTML, JavaScript and CSS.
     *
     * The whole playground state is encoded in the returned URL, so no data is
     * stored server-side. Open the URL to see the components rendered live and
     * editable. The HTML field accepts Twig using the `@ui/` namespace, e.g.
     * `{% include '@ui/Accordion/Accordion.twig' with { items: items } %}`.
     *
     * @param string      $html   The Twig/HTML markup rendered in the playground
     * @param string|null $script Optional JavaScript, typically a js-toolkit app bootstrapping the components
     * @param string|null $css    Optional CSS (Tailwind utility classes are available without it)
     * @param string      $theme  Color theme, either "light" or "dark"
     * @param string|null $header Optional header shown above the preview
     */
    #[McpTool(name: 'build_playground_url')]
    public function buildPlaygroundUrl(
        string $html,
        ?string $script = null,
        ?string $css = null,
        string $theme = 'light',
        ?string $header = null,
    ): string {
        $theme = 'dark' === $theme ? 'dark' : 'light';

        return $this->urlBuilder->build($html, $script, $css, $theme, $header);
    }

    /**
     * Read the content of a shared playground URL.
     *
     * The inverse of `build_playground_url`: decode a link into its Twig/HTML,
     * JavaScript, CSS and theme so you can inspect or edit an existing
     * playground. Pass the full URL (the state lives in the part after `#`).
     *
     * @param string $url The playground URL to decode
     *
     * @return array{html?: string, script?: string, css?: string, theme?: string, header?: string}
     */
    #[McpTool(name: 'parse_playground_url')]
    public function parsePlaygroundUrl(string $url): array
    {
        try {
            return $this->urlBuilder->parse($url);
        } catch (\RuntimeException $e) {
            throw new ToolCallException($e->getMessage(), previous: $e);
        }
    }
}
