<?php

namespace Studiometa\Ui\TwigFunctions;

use Twig\Environment;

class Icon extends AbstractTwigFunction
{
    /**
     * Path to locally stored icon SVG files.
     */
    private ?string $iconPath = null;

    /**
     * Iconify API base URL (overridable for testing).
     */
    private string $apiUrl = 'https://api.iconify.design';

    /**
     * {@inheritdoc}
     */
    public function name(): string
    {
        return 'meta_icon';
    }

    /**
     * {@inheritdoc}
     */
    public function options(): array
    {
        return [
            'needs_environment' => true,
            'is_safe' => ['html']
        ];
    }

    /**
     * Set the path to locally stored icons.
     */
    public function setIconPath(string $path): void
    {
        $this->iconPath = rtrim($path, '/');
    }

    /**
     * Set the Iconify API base URL.
     */
    public function setApiUrl(string $url): void
    {
        $this->apiUrl = rtrim($url, '/');
    }

    /**
     * Get the configured icon path, with auto-detection fallback.
     */
    private function getIconPath(): ?string
    {
        if ($this->iconPath !== null) {
            return $this->iconPath;
        }

        // Auto-detect: look for assets/icons relative to the project root.
        // Walk up from vendor dir to find project root.
        $dir = __DIR__;
        while ($dir !== '/' && $dir !== '') {
            if (file_exists($dir . '/composer.json') && is_dir($dir . '/vendor')) {
                $candidate = $dir . '/assets/icons';
                if (is_dir($candidate)) {
                    $this->iconPath = $candidate;
                    return $this->iconPath;
                }
                break;
            }
            $dir = dirname($dir);
        }

        return null;
    }

    /**
     * Execute the function.
     */
    public function run(Environment $env, string $icon): string
    {
        [$prefix, $name] = explode(':', $icon, 2);

        // Try local file first
        $iconPath = $this->getIconPath();
        if ($iconPath !== null) {
            $localFile = sprintf('%s/%s/%s.svg', $iconPath, $prefix, $name);
            if (file_exists($localFile)) {
                $content = file_get_contents($localFile);
                if ($content !== false) {
                    return trim($content);
                }
            }
        }

        // In debug mode, fetch the icon on-the-fly from the Iconify API
        // and save it locally so it's available on next page load.
        if ($env->isDebug()) {
            $svg = $this->fetchAndSave($prefix, $name, $iconPath);
            if ($svg !== null) {
                return $svg;
            }
        }

        // Fallback: try iconify/json if installed (backward compatibility)
        if (class_exists(\Iconify\JSONTools\Collection::class)) {
            return $this->fromIconifyJson($env, $prefix, $name);
        }

        return $env->isDebug()
            ? "<!-- Icon '$prefix:$name' not found. Run 'composer ui:icons' to sync icons. -->"
            : "";
    }

    /**
     * Fetch a single icon from the Iconify API and save it locally.
     * Used in debug mode so developers don't need to run `composer ui:icons`
     * after adding a new icon reference in a template.
     */
    private function fetchAndSave(string $prefix, string $name, ?string $iconPath): ?string
    {
        if ($iconPath === null) {
            // Auto-detect the project root and create the default output dir
            $dir = __DIR__;
            while ($dir !== '/' && $dir !== '') {
                if (file_exists($dir . '/composer.json') && is_dir($dir . '/vendor')) {
                    $iconPath = $dir . '/assets/icons';
                    break;
                }
                $dir = dirname($dir);
            }

            if ($iconPath === null) {
                return null;
            }
        }

        $fetcher = new \Studiometa\Ui\Composer\IconFetcher($this->apiUrl);
        $svgs = $fetcher->fetch(["$prefix:$name"]);

        if (!isset($svgs["$prefix:$name"])) {
            return null;
        }

        $svg = $svgs["$prefix:$name"];

        // Save locally for future requests
        $storage = new \Studiometa\Ui\Composer\IconStorage($iconPath);
        $storage->save(["$prefix:$name" => $svg]);

        // Cache the icon path for subsequent calls
        $this->iconPath = $iconPath;

        return trim($svg);
    }

    /**
     * Load icon from the iconify/json package (legacy fallback).
     */
    private function fromIconifyJson(Environment $env, string $collection, string $icon): string
    {
        $collection_instance = new \Iconify\JSONTools\Collection();

        $collection_file = $collection_instance->findIconifyCollection($collection);

        if (!(file_exists($collection_file) && $collection_instance->loadIconifyCollection($collection))) {
            return $env->isDebug() ? "Could not find the '$collection' collection." : "";
        }

        $data = $collection_instance->getIconData($icon);

        if (!$data) {
            return $env->isDebug() ? "Could not find the '$icon' icon in the '$collection' collection." : "";
        }

        $svg = new \Iconify\JSONTools\SVG($data);
        return $svg->getSVG($data);
    }
}
