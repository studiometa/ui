<?php

namespace App\Mcp\Tool;

use App\Mcp\PlaygroundUrlBuilder;
use Mcp\Capability\Attribute\McpTool;

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
}
