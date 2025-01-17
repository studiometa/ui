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
        FilesystemLoader $loader = null,
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
            ),
        );
    }

    /**
     * Get global variables.
     *
     * @return array
     */
    public function getGlobals()
    {
        return [
            'ui' => [
                'ease' => [
                    'linear'       => [0, 0, 1, 1],
                    'in_back'      => [0.6, -0.28, 0.735, 0.045],
                    'in_circ'      => [0.6, 0.04, 0.98, 0.335],
                    'in_cubic'     => [0.55, 0.055, 0.675, 0.19],
                    'in_expo'      => [0.95, 0.05, 0.795, 0.035],
                    'in_quad'      => [0.55, 0.085, 0.68, 0.53],
                    'in_quart'     => [0.895, 0.03, 0.685, 0.22],
                    'in_quint'     => [0.755, 0.05, 0.855, 0.06],
                    'in_sine'      => [0.47, 0, 0.745, 0.715],
                    'out_back'     => [0.175, 0.885, 0.32, 1.275],
                    'out_circ'     => [0.075, 0.82, 0.165, 1],
                    'out_cubic'    => [0.215, 0.61, 0.355, 1],
                    'out_expo'     => [0.19, 1, 0.22, 1],
                    'out_quad'     => [0.25, 0.46, 0.45, 0.94],
                    'out_quart'    => [0.165, 0.84, 0.44, 1],
                    'out_quint'    => [0.23, 1, 0.32, 1],
                    'out_sine'     => [0.39, 0.575, 0.565, 1],
                    'in_out_back'  => [0.68, -0.55, 0.265, 1.55],
                    'in_out_circ'  => [0.785, 0.135, 0.15, 0.86],
                    'in_out_cubic' => [0.645, 0.045, 0.355, 1],
                    'in_out_expo'  => [1, 0, 0, 1],
                    'in_out_quad'  => [0.455, 0.03, 0.515, 0.955],
                    'in_out_quart' => [0.77, 0, 0.175, 1],
                    'in_out_quint' => [0.86, 0, 0.07, 1],
                    'in_out_sine'  => [0.445, 0.05, 0.55, 0.95],
                ],
            ],
        ];
    }
}
