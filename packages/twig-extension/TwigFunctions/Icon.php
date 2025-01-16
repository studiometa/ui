<?php

namespace Studiometa\Ui\TwigFunctions;

use Iconify\JSONTools\Collection;
use Iconify\JSONTools\SVG;
use Twig\Environment;

class Icon extends AbstractTwigFunction {
    /**
     * {@inheritdoc}
     */
    public function name(): string {
        return 'meta_icon';
    }

    /**
     * {@inheritdoc}
     */
    public function options(): array {
        return [
            'needs_environment' => true,
            'is_safe' => ['html']
        ];
    }

    /**
     * Execute the function.
     *
     * @param  string $icon_name Name composed with an icon collection and an icon name.
     * @return string
     */
    public function run( Environment $env, string $collection, string $icon ): string {
        $collection_instance = new Collection();

        $collection_file = $collection_instance->findIconifyCollection($collection);

        if (! (file_exists($collection_file) && $collection_instance->loadIconifyCollection($collection))) {
            return $env->isDebug() ? "Could not find the '$collection' collection." : "";
        }

        $data = $collection_instance->getIconData($icon);

        if (!$data) {
            return $env->isDebug() ? "Could not find the '$icon' icon in the '$collection' collection." : "";
        }

        $svg = new SVG($data);
        return $svg->getSVG();
    }
}
