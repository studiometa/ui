<?php

namespace App\Mcp;

/**
 * Builds shareable playground URLs.
 *
 * The playground stores its whole state in the URL hash as a `URLSearchParams`
 * string where the code fields (`html`, `script`, `style`) are individually
 * compressed. The compression mirrors the front-end `zip()` helper from
 * `@studiometa/playground`: zlib (level 9) wrapped, then base64 encoded.
 * PHP's `gzcompress($data, 9)` produces the exact zlib stream the front-end
 * `unzip()` expects (it detects the `0x78 0xDA` header).
 */
final class PlaygroundUrlBuilder
{
    public function __construct(
        private readonly string $baseUrl,
    ) {
    }

    /**
     * @param 'light'|'dark' $theme
     */
    public function build(
        string $html,
        ?string $script = null,
        ?string $css = null,
        string $theme = 'light',
        ?string $header = null,
    ): string {
        $params = [
            'html' => $this->zip($html),
        ];

        if (null !== $script && '' !== $script) {
            $params['script'] = $this->zip($script);
        }

        if (null !== $css && '' !== $css) {
            $params['style'] = $this->zip($css);
        }

        $params['theme'] = $theme;

        if (null !== $header && '' !== $header) {
            $params['header'] = $header;
        }

        return rtrim($this->baseUrl, '/').'/#'.http_build_query($params);
    }

    /**
     * Compress a string the same way the playground front-end does.
     */
    private function zip(string $data): string
    {
        $compressed = gzcompress($data, 9);
        if (false === $compressed) {
            throw new \RuntimeException('Failed to compress playground content.');
        }

        return base64_encode($compressed);
    }
}
