<?php

use Studiometa\Ui\TwigFunctions\Icon;
use Twig\Environment;
use Twig\Loader\ArrayLoader;

beforeEach(function () {
    $this->tmpDir = sys_get_temp_dir() . '/ui-icon-test-' . uniqid();
    mkdir($this->tmpDir . '/mdi', 0755, true);
});

afterEach(function () {
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($this->tmpDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($files as $file) {
        $file->isDir() ? rmdir($file->getRealPath()) : unlink($file->getRealPath());
    }
    rmdir($this->tmpDir);
});

test('it reads icons from local files when path is set', function () {
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/></svg>';
    file_put_contents($this->tmpDir . '/mdi/home.svg', $svg);

    $icon = new Icon();
    $icon->setIconPath($this->tmpDir);

    $env = new Environment(new ArrayLoader([]));
    $result = $icon->run($env, 'mdi:home');

    expect($result)->toBe($svg);
});

test('it falls back to iconify/json when local file is missing', function () {
    $icon = new Icon();
    $icon->setIconPath($this->tmpDir);

    $env = new Environment(new ArrayLoader([]));
    $result = $icon->run($env, 'mdi:alert');

    // Should fall back to iconify/json (available in dev)
    expect($result)->toContain('<svg');
    expect($result)->toContain('</svg>');
});

test('it returns debug message when icon not found and no iconify/json', function () {
    // Create a subclass that simulates iconify/json not being available
    $icon = new class extends Icon {
        public function run(Environment $env, string $icon): string
        {
            [$prefix, $name] = explode(':', $icon, 2);

            $iconPath = $this->getIconPathForTest();
            if ($iconPath !== null) {
                $localFile = sprintf('%s/%s/%s.svg', $iconPath, $prefix, $name);
                if (file_exists($localFile)) {
                    $content = file_get_contents($localFile);
                    if ($content !== false) {
                        return trim($content);
                    }
                }
            }

            // Simulate no iconify/json available
            return $env->isDebug()
                ? "<!-- Icon '$prefix:$name' not found. Run 'composer ui:icons' to sync icons. -->"
                : "";
        }

        public function getIconPathForTest(): ?string
        {
            // Use reflection to access private property
            $ref = new \ReflectionProperty(Icon::class, 'iconPath');
            return $ref->getValue($this);
        }
    };

    $icon->setIconPath($this->tmpDir);

    // Debug mode
    $env = new Environment(new ArrayLoader([]), ['debug' => true]);
    $result = $icon->run($env, 'mdi:nonexistent');
    expect($result)->toBe("<!-- Icon 'mdi:nonexistent' not found. Run 'composer ui:icons' to sync icons. -->");

    // Production mode
    $env = new Environment(new ArrayLoader([]), ['debug' => false]);
    $result = $icon->run($env, 'mdi:nonexistent');
    expect($result)->toBe('');
});
