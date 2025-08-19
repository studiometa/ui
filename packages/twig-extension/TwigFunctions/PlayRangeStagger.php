<?php

namespace Studiometa\Ui\TwigFunctions;

class PlayRangeStagger extends AbstractTwigFunction
{
    /**
     * {@inheritdoc}
     */
    public function name(): string
    {
        return 'play_range_stagger';
    }

    /**
     * {@inheritdoc}
     */
    public function options(): array
    {
        return [
            'needs_context' => true,
            'is_safe' => ['html']
        ];
    }

    /**
     * Execute the function.
     *
     * Calculates staggered play ranges for animation sequences.
     * Uses a fixed step between starts and overlapping durations.
     *
     * @param array{ _key?: int, _seq?: array } $context The current Twig context
     * @param float $step Inter-start delay as fraction of timeline (e.g., 0.1)
     * @return array [start, end] range between 0 and 1
     */
    public function run(array $context, float $step = 0.1, int|null $length = null, int|null $index = null): array
    {
        // Try to get loop values from parameters first, then fallback to context
        if ($length !== null && $index !== null) {
            // Use provided parameters as fallback
        } elseif (isset($context['_key']) && isset($context['_seq'])) {
            $length = count($context['_seq']);
            $index = $context['_key'];
        } else {
            // phpcs:ignore Generic.Files.LineLength.TooLong
            throw new \Exception('Could not infer loop from the current Twig context, provide `length` and `index` parameter.');
        }

        if ($length <= 0) {
            return [0, 1];
        }

        $step = min(1, max(0, $step));
        $duration = max(0, 1 - $step * ($length - 1));
        $start = $step * $index;
        $end = min(1, $start + $duration);

        return [round($start, 5), round($end, 5)];
    }
}
