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
     * Decode the content of a playground URL.
     *
     * The inverse of {@see build()}: reads the URL hash (or query), decompresses
     * the `html`, `script` and `style` fields, and returns them alongside the
     * plain `theme` and `header` values. The `style` field is exposed as `css`
     * for symmetry with {@see build()}.
     *
     * @return array{html?: string, script?: string, css?: string, theme?: string, header?: string}
     */
    public function parse(string $url): array
    {
        // The state lives in the URL fragment; fall back to the query string, or
        // treat the whole input as the parameter string.
        if (str_contains($url, '#')) {
            $fragment = substr($url, strpos($url, '#') + 1);
        } elseif (str_contains($url, '?')) {
            $fragment = substr($url, strpos($url, '?') + 1);
        } else {
            $fragment = $url;
        }

        parse_str($fragment, $params);

        $result = [];
        foreach (['html' => 'html', 'script' => 'script', 'style' => 'css'] as $key => $out) {
            if (isset($params[$key]) && \is_string($params[$key]) && '' !== $params[$key]) {
                $result[$out] = $this->unzip($params[$key]);
            }
        }

        foreach (['theme', 'header'] as $key) {
            if (isset($params[$key]) && \is_string($params[$key]) && '' !== $params[$key]) {
                $result[$key] = $params[$key];
            }
        }

        if ([] === $result) {
            throw new \RuntimeException('No playground content found in the given URL.');
        }

        return $result;
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

    /**
     * Decompress a value the same way the playground front-end `unzip()` does.
     */
    private function unzip(string $value): string
    {
        // `URLSearchParams` (and PHP's parse_str) turn a literal `+` into a
        // space; valid base64 never contains a space, so restoring it makes the
        // parser tolerant of URLs that were decoded once (e.g. copied from an
        // address bar that shows the percent-decoded form).
        $binary = base64_decode(strtr($value, ' ', '+'), true);
        if (false === $binary) {
            throw new \RuntimeException('A playground field is not valid base64.');
        }

        // zlib streams start with 0x78; anything else is stored uncompressed.
        if (str_starts_with($binary, "\x78")) {
            // Cap the decompressed size to guard against a decompression bomb in
            // an attacker-supplied URL (playground content is tiny in practice).
            $inflated = @gzuncompress($binary, 10_000_000);
            if (false !== $inflated) {
                return $inflated;
            }
        }

        return $binary;
    }
}
