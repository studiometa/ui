<?php

namespace Studiometa\Ui\TwigFunctions;

use Twig\TwigFunction;

class TwigFunctionProvider {
    /**
     * Get a Twig function.
     *
     * @param  class-string<TwigFunctionInterface>
     * @return TwigFunction[]
     */
    public static function provide( string ...$class_names ): array {
        $functions = [];

        foreach ($class_names as $class_name) {
            $instance = new $class_name();

            $functions[] = new TwigFunction(
                $instance->name(),
                $instance->run(...),
                $instance->options(),
            );
        }

        return $functions;
    }
}
