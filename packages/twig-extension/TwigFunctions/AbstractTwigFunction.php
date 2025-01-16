<?php

namespace Studiometa\Ui\TwigFunctions;

abstract class AbstractTwigFunction implements TwigFunctionInterface {
    /**
     * Name of the function.
     */
    public function name(): string {
        return '';
    }

    /**
     * Get options for the TwigFunction instance.
     */
    public function options(): array {
        return [];
    }
}
