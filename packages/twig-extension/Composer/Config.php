<?php

namespace Studiometa\Ui\Composer;

use Composer\Composer;

/**
 * Configuration reader for the studiometa/ui Composer plugin.
 *
 * Reads settings from the consuming project's composer.json "extra" section:
 *
 * ```json
 * {
 *     "extra": {
 *         "studiometa/ui": {
 *             "icons": {
 *                 "enabled": true,
 *                 "output": "assets/icons",
 *                 "scan": ["templates", "app"],
 *                 "include": ["mdi:loading"],
 *                 "exclude": ["mdi:test-*"]
 *             }
 *         }
 *     }
 * }
 * ```
 */
class Config
{
    /**
     * Default configuration values.
     *
     * @var array{
     *     enabled: bool,
     *     output: string,
     *     scan: list<string>,
     *     include: list<string>,
     *     exclude: list<string>,
     *     api: string
     * }
     */
    private const DEFAULTS = [
        'enabled' => true,
        'output' => 'assets/icons',
        'scan' => ['templates'],
        'include' => [],
        'exclude' => [],
        'api' => 'https://api.iconify.design',
    ];

    /**
     * @var array{
     *     enabled: bool,
     *     output: string,
     *     scan: list<string>,
     *     include: list<string>,
     *     exclude: list<string>,
     *     api: string
     * }
     */
    private array $config;

    private string $projectDir;

    public function __construct(Composer $composer)
    {
        $extra = $composer->getPackage()->getExtra();
        $uiConfig = $extra['studiometa/ui'] ?? [];
        $iconsConfig = is_array($uiConfig)
            ? ($uiConfig['icons'] ?? [])
            : [];

        /** @var array{
         *     enabled: bool,
         *     output: string,
         *     scan: list<string>,
         *     include: list<string>,
         *     exclude: list<string>,
         *     api: string
         * } $merged
         */
        $merged = array_merge(
            self::DEFAULTS,
            is_array($iconsConfig) ? $iconsConfig : []
        );
        $this->config = $merged;

        /** @var string $vendorDir */
        $vendorDir = $composer->getConfig()->get('vendor-dir');
        $this->projectDir = dirname($vendorDir);
    }

    /**
     * Whether icon syncing is enabled.
     */
    public function isEnabled(): bool
    {
        return (bool) $this->config['enabled'];
    }

    /**
     * Get the output directory for icon SVG files (absolute path).
     */
    public function getOutputDir(): string
    {
        $output = $this->config['output'];

        if (str_starts_with($output, '/')) {
            return $output;
        }

        return $this->projectDir . '/' . $output;
    }

    /**
     * Get the directories to scan for meta_icon() calls (absolute paths).
     *
     * @return list<string>
     */
    public function getScanDirs(): array
    {
        $projectDir = $this->projectDir;

        return array_map(
            function (string $dir) use ($projectDir): string {
                if (str_starts_with($dir, '/')) {
                    return $dir;
                }
                return $projectDir . '/' . $dir;
            },
            $this->config['scan']
        );
    }

    /**
     * Get manually included icons (always fetched).
     *
     * @return list<string>
     */
    public function getIncludedIcons(): array
    {
        return $this->config['include'];
    }

    /**
     * Get excluded icon patterns.
     *
     * @return list<string>
     */
    public function getExcludedPatterns(): array
    {
        return $this->config['exclude'];
    }

    /**
     * Get the Iconify API base URL.
     */
    public function getApiUrl(): string
    {
        return rtrim($this->config['api'], '/');
    }

    /**
     * Get the project root directory.
     */
    public function getProjectDir(): string
    {
        return $this->projectDir;
    }
}
