<?php

namespace Studiometa\Ui\Composer;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RegexIterator;

/**
 * Scans template files for meta_icon() calls and extracts icon references.
 */
class IconScanner
{
    /**
     * File extensions to scan.
     */
    private const EXTENSIONS = ['twig', 'html', 'php'];

    /**
     * Regex patterns to match meta_icon() calls.
     * Supports:
     *   - meta_icon('prefix:name')
     *   - meta_icon("prefix:name")
     *   - {{ meta_icon('prefix:name') }}
     */
    private const PATTERNS = [
        '/meta_icon\(\s*[\'"]([a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+)[\'"]\s*\)/',
    ];

    /**
     * Scan directories for icon references.
     *
     * @param string[] $directories Absolute paths to scan.
     * @param string[] $excludePatterns Patterns to exclude (supports * wildcard).
     * @return string[] List of unique icon references (e.g., ['mdi:home', 'mdi:alert']).
     */
    public function scan(array $directories, array $excludePatterns = []): array
    {
        $icons = [];

        foreach ($directories as $directory) {
            if (!is_dir($directory)) {
                continue;
            }

            $icons = array_merge($icons, $this->scanDirectory($directory));
        }

        $icons = array_unique($icons);
        sort($icons);

        if (!empty($excludePatterns)) {
            $icons = $this->filterExcluded($icons, $excludePatterns);
        }

        return array_values($icons);
    }

    /**
     * Scan a single directory recursively.
     *
     * @return string[]
     */
    private function scanDirectory(string $directory): array
    {
        $icons = [];
        $extensions = implode('|', self::EXTENSIONS);

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        $regex = new RegexIterator($iterator, '/\.(' . $extensions . ')$/i');

        foreach ($regex as $file) {
            /** @var \SplFileInfo $file */
            $content = file_get_contents($file->getPathname());

            if ($content === false) {
                continue;
            }

            foreach (self::PATTERNS as $pattern) {
                if (preg_match_all($pattern, $content, $matches)) {
                    $icons = array_merge($icons, $matches[1]);
                }
            }
        }

        return $icons;
    }

    /**
     * Filter out icons matching exclude patterns.
     *
     * @param string[] $icons
     * @param string[] $patterns Glob-like patterns (supports * wildcard).
     * @return string[]
     */
    private function filterExcluded(array $icons, array $patterns): array
    {
        return array_filter($icons, function (string $icon) use ($patterns): bool {
            foreach ($patterns as $pattern) {
                $regex = '/^' . str_replace('\*', '.*', preg_quote($pattern, '/')) . '$/';
                if (preg_match($regex, $icon)) {
                    return false;
                }
            }
            return true;
        });
    }
}
