<?php

namespace Studiometa\Ui\Composer;

/**
 * Manages local SVG icon files.
 *
 * Stores icons in a directory structure:
 *   {output}/{prefix}/{name}.svg
 */
class IconStorage
{
    private string $outputDir;

    public function __construct(string $outputDir)
    {
        $this->outputDir = rtrim($outputDir, '/');
    }

    /**
     * Save icon SVGs to disk.
     *
     * @param array<string, string> $icons Map of icon reference => SVG content.
     * @return int Number of icons written.
     */
    public function save(array $icons): int
    {
        $count = 0;

        foreach ($icons as $reference => $svg) {
            $path = $this->getPath($reference);
            $dir = dirname($path);

            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            file_put_contents($path, $svg . "\n");
            $count++;
        }

        return $count;
    }

    /**
     * Get the file path for an icon reference.
     */
    public function getPath(string $reference): string
    {
        [$prefix, $name] = explode(':', $reference, 2);

        return sprintf('%s/%s/%s.svg', $this->outputDir, $prefix, $name);
    }

    /**
     * Check if an icon exists locally.
     */
    public function has(string $reference): bool
    {
        return file_exists($this->getPath($reference));
    }

    /**
     * Read an icon SVG from disk.
     */
    public function read(string $reference): ?string
    {
        $path = $this->getPath($reference);

        if (!file_exists($path)) {
            return null;
        }

        $content = file_get_contents($path);

        return $content !== false ? trim($content) : null;
    }

    /**
     * List all locally stored icon references.
     *
     * @return string[]
     */
    public function list(): array
    {
        $icons = [];

        if (!is_dir($this->outputDir)) {
            return $icons;
        }

        $prefixes = scandir($this->outputDir);

        if ($prefixes === false) {
            return $icons;
        }

        foreach ($prefixes as $prefix) {
            if ($prefix === '.' || $prefix === '..') {
                continue;
            }

            $prefixDir = $this->outputDir . '/' . $prefix;

            if (!is_dir($prefixDir)) {
                continue;
            }

            $files = scandir($prefixDir);

            if ($files === false) {
                continue;
            }

            foreach ($files as $file) {
                if (str_ends_with($file, '.svg')) {
                    $name = substr($file, 0, -4);
                    $icons[] = "$prefix:$name";
                }
            }
        }

        sort($icons);

        return $icons;
    }

    /**
     * Remove icons that are not in the given list.
     *
     * @param string[] $keepIcons Icons to keep.
     * @return string[] List of removed icon references.
     */
    public function prune(array $keepIcons): array
    {
        $existing = $this->list();
        $removed = [];

        foreach ($existing as $icon) {
            if (!in_array($icon, $keepIcons, true)) {
                $path = $this->getPath($icon);
                if (file_exists($path)) {
                    unlink($path);
                    $removed[] = $icon;
                }
            }
        }

        // Clean up empty prefix directories
        $this->cleanEmptyDirs();

        return $removed;
    }

    /**
     * Remove empty prefix directories.
     */
    private function cleanEmptyDirs(): void
    {
        if (!is_dir($this->outputDir)) {
            return;
        }

        $prefixes = scandir($this->outputDir);

        if ($prefixes === false) {
            return;
        }

        foreach ($prefixes as $prefix) {
            if ($prefix === '.' || $prefix === '..') {
                continue;
            }

            $prefixDir = $this->outputDir . '/' . $prefix;

            if (!is_dir($prefixDir)) {
                continue;
            }

            $files = scandir($prefixDir);

            if ($files !== false && count($files) === 2) {
                // Only . and .. remain
                rmdir($prefixDir);
            }
        }
    }

    /**
     * Get the output directory.
     */
    public function getOutputDir(): string
    {
        return $this->outputDir;
    }
}
