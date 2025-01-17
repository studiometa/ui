<?php

namespace Studiometa\Ui\TwigFunctions;

abstract class AbstractTwigFunction implements TwigFunctionInterface
{
    /**
     * {@inheritdoc}
     */
    public function name(): string
    {
        return '';
    }

    /**
     * {@inheritdoc}
     */
    public function options(): array
    {
        return [];
    }

    /**
     * {@inheritdoc}
     */
    public function callback(): callable
    {
        if (method_exists($this, 'run')) {
            return $this->run(...);
        }

        return fn () => null;
    }
}
