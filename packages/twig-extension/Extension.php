<?php
/**
 * @link https://github.com/studiometa/ui
 * @copyright Studio Meta
 * @license https://github.com/studiometa/ui/blob/master/LICENSE
 */

namespace Studiometa\Ui;

use Twig\Loader\FilesystemLoader;
use Studiometa\TwigToolkit\Extension as TwigToolkitExtension;
use Studiometa\Ui\TwigFunctions\TwigFunctionProvider;
use Studiometa\Ui\TwigFunctions\Icon;
use Studiometa\Ui\TwigFunctions\Ui;

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
     * @param FilesystemLoader|null $loader        A filesystem loader instance to register the namespaces.
     * @param string                $template_path The path to your projects templates.
     * @param string                $svg_path      The path to your projects SVG files.
     */
    public function __construct(
        FilesystemLoader|null $loader = null,
        string $template_path = '',
        string $svg_path = ''
    ) {
        if ($loader) {
            $pkg_path = dirname(__DIR__);

            // Add custom paths first
            if ($template_path) {
                $loader->addPath($template_path, 'ui');
            }

            if ($svg_path) {
                $loader->addPath($svg_path, 'svg');
            }

            $pkg_template_path = $pkg_path . '/ui';
            $pkg_svg_path = $pkg_path . '/ui/svg';

            // Add package paths last as fallbacks
            $loader->addPath($pkg_template_path, 'ui');
            $loader->addPath($pkg_svg_path, 'svg');

            // Add package paths with a different namespace to avoid infinite loops
            $loader->addPath($pkg_template_path, 'ui-pkg');
            $loader->addPath($pkg_svg_path, 'svg-pkg');
        }
    }

    public function getFunctions()
    {
        return array_merge(
            parent::getFunctions(),
            TwigFunctionProvider::provide(
                Icon::class,
                Ui::class,
            ),
        );
    }
}
