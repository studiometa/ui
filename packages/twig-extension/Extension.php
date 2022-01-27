<?php
/**
 * @link https://github.com/studiometa/ui
 * @copyright Studio Meta
 * @license https://github.com/studiometa/ui/blob/master/LICENSE
 */

namespace Studiometa\Ui;

use Twig\Loader\FilesystemLoader;
use Studiometa\TwigToolkit\Extension as TwigToolkitExtension;

/**
 * Twig extension class.
 *
 * @author Studio Meta <agence@studiometa.fr>
 * @since 1.0.0
 */
class Extension extends TwigToolkitExtension
{
    /**
     * Constructor.
     * @param FilesystemLoader|null $loader     A filesystem loader instance to register the namespaces.
     * @param string                $theme_path The path to your projects templates.
     * @param string                $svg_path   The path to your projects SVG files.
     */
    public function __construct(
        FilesystemLoader $loader = null,
        string $theme_path,
        string $svg_path
    ) {
        if ($loader) {
            $pkg_path = dirname(__DIR__);
            $loader->addPath($pkg_path . '/ui', 'ui');
            $loader->addPath($theme_path ?? $pkg_path . '/ui', 'theme');
            $loader->addPath($svg_path ?? $pkg_path . '/ui/svg', 'svg');
        }
    }
}
