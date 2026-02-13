<?php

namespace Studiometa\Ui\Composer;

use Composer\Plugin\Capability\CommandProvider;

/**
 * Provides Composer CLI commands for icon management.
 */
class PluginCommandProvider implements CommandProvider
{
    /**
     * {@inheritdoc}
     */
    public function getCommands(): array
    {
        return [
            new IconSyncCommand(),
            new IconPruneCommand(),
        ];
    }
}
