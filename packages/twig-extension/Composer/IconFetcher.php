<?php

namespace Studiometa\Ui\Composer;

/**
 * Fetches icon SVGs from the Iconify API.
 *
 * Uses the batch JSON endpoint to minimize HTTP requests:
 * GET https://api.iconify.design/{prefix}.json?icons=name1,name2,...
 */
class IconFetcher
{
    /**
     * Maximum number of icons per API request.
     */
    private const BATCH_SIZE = 50;

    private string $apiUrl;

    public function __construct(
        string $apiUrl = 'https://api.iconify.design'
    ) {
        $this->apiUrl = rtrim($apiUrl, '/');
    }

    /**
     * Fetch SVG content for a list of icons.
     *
     * @param string[] $icons Icon references (e.g., ['mdi:home']).
     * @return array<string, string> Map of reference => SVG content.
     */
    public function fetch(array $icons): array
    {
        $grouped = $this->groupByPrefix($icons);
        $results = [];

        foreach ($grouped as $prefix => $names) {
            foreach (array_chunk($names, self::BATCH_SIZE) as $batch) {
                $data = $this->fetchBatch($prefix, $batch);

                if ($data === null) {
                    continue;
                }

                /**
                 * @var array<string, array{
                 *     body: string,
                 *     width?: int,
                 *     height?: int,
                 *     left?: int,
                 *     top?: int
                 * }> $dataIcons
                 */
                $dataIcons = $data['icons'];

                foreach ($batch as $name) {
                    if (isset($dataIcons[$name])) {
                        $results["$prefix:$name"] = $this->buildSvg(
                            $data,
                            $dataIcons[$name]
                        );
                    }
                }
            }
        }

        return $results;
    }

    /**
     * Group icon references by their prefix.
     *
     * @param string[] $icons
     * @return array<string, list<string>>
     */
    private function groupByPrefix(array $icons): array
    {
        $grouped = [];

        foreach ($icons as $icon) {
            $parts = explode(':', $icon, 2);
            if (count($parts) !== 2) {
                continue;
            }

            [$prefix, $name] = $parts;
            $grouped[$prefix][] = $name;
        }

        return $grouped;
    }

    /**
     * Fetch a batch of icons from the API.
     *
     * @param string[] $names
     * @return array{
     *     icons: array<string, array{
     *         body: string,
     *         width?: int,
     *         height?: int,
     *         left?: int,
     *         top?: int
     *     }>,
     *     width?: int,
     *     height?: int,
     *     left?: int,
     *     top?: int
     * }|null
     */
    private function fetchBatch(string $prefix, array $names): ?array
    {
        $url = sprintf(
            '%s/%s.json?icons=%s',
            $this->apiUrl,
            urlencode($prefix),
            implode(',', array_map('urlencode', $names))
        );

        $context = stream_context_create([
            'http' => [
                'timeout' => 30,
                'header' => "User-Agent: studiometa/ui\r\n",
            ],
        ]);

        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            return null;
        }

        /** @var mixed $data */
        $data = json_decode($response, true);

        if (!is_array($data) || !isset($data['icons'])) {
            return null;
        }

        /**
         * @var array{
         *     icons: array<string, array{
         *         body: string,
         *         width?: int,
         *         height?: int,
         *         left?: int,
         *         top?: int
         *     }>,
         *     width?: int,
         *     height?: int,
         *     left?: int,
         *     top?: int
         * } $data
         */
        return $data;
    }

    /**
     * Build an SVG string from Iconify API data.
     *
     * @param array{icons: mixed, width?: int, height?: int, left?: int, top?: int} $collectionData
     * @param array{body: string, width?: int, height?: int, left?: int, top?: int} $iconData
     */
    private function buildSvg(
        array $collectionData,
        array $iconData
    ): string {
        $width = $iconData['width']
            ?? $collectionData['width'] ?? 24;
        $height = $iconData['height']
            ?? $collectionData['height'] ?? 24;
        $left = $iconData['left']
            ?? $collectionData['left'] ?? 0;
        $top = $iconData['top']
            ?? $collectionData['top'] ?? 0;

        $viewBox = sprintf(
            '%d %d %d %d',
            $left,
            $top,
            $width,
            $height
        );

        $parts = [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            'xmlns:xlink="http://www.w3.org/1999/xlink"',
            sprintf('width="%s"', $width),
            sprintf('height="%s"', $height),
            'preserveAspectRatio="xMidYMid meet"',
            sprintf('viewBox="%s">', $viewBox),
        ];

        return implode(' ', $parts) . $iconData['body'] . '</svg>';
    }
}
