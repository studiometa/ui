<?php

namespace Studiometa\Ui\Composer;

use Composer\Command\BaseCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Composer command: ui:icons:prune
 *
 * Removes icons that are no longer referenced in templates.
 */
class IconPruneCommand extends BaseCommand
{
    protected function configure(): void
    {
        $this
            ->setName('ui:icons:prune')
            ->setDescription(
                'Remove icons no longer referenced in templates.'
            );
    }

    protected function execute(
        InputInterface $input,
        OutputInterface $output
    ): int {
        $composer = $this->requireComposer();
        $config = new Config($composer);

        if (!$config->isEnabled()) {
            $output->writeln(
                '<comment>Icon syncing is disabled.</comment>'
            );
            return 0;
        }

        $scanner = new IconScanner();
        $storage = new IconStorage($config->getOutputDir());

        // Scan for icons
        $scannedIcons = $scanner->scan(
            $config->getScanDirs(),
            $config->getExcludedPatterns()
        );
        $keepIcons = array_unique(
            array_merge($scannedIcons, $config->getIncludedIcons())
        );

        // Prune
        $removed = $storage->prune($keepIcons);

        if (empty($removed)) {
            $output->writeln('<info>No unused icons found.</info>');
            return 0;
        }

        $output->writeln(sprintf(
            '<info>Pruned %d unused icon(s):</info>',
            count($removed)
        ));

        foreach ($removed as $icon) {
            $output->writeln(sprintf('  ✗ %s', $icon));
        }

        return 0;
    }
}
