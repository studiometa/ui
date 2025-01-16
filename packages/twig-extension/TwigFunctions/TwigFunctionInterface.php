<?php

namespace Studiometa\Ui\TwigFunctions;

interface TwigFunctionInterface {
    /**
     * Name of the function.
     */
    public function name(): string;

    /**
     * Get options for the TwigFunction instance.
     */
    public function options(): array;
}
