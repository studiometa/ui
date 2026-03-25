<?php

namespace Studiometa\Ui\Composer;

use Composer\Command\BaseCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Composer command: ui:icons
 *
 * Scans templates for meta_icon() calls and fetches icons
 * from the Iconify API.
 */
class IconSyncCommand extends BaseCommand
{
    protected function configure(): void
    {
        $this
            ->setName('ui:icons')
            ->setDescription(
                'Sync icons from the Iconify API based on template usage.'
            )
            ->addOption(
                'dry-run',
                null,
                InputOption::VALUE_NONE,
                'Show detected icons without fetching.'
            )
            ->addOption(
                'prune',
                null,
                InputOption::VALUE_NONE,
                'Remove unused icons after syncing.'
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
        $fetcher = new IconFetcher($config->getApiUrl());
        $storage = new IconStorage($config->getOutputDir());

        // Scan for icons
        $output->writeln('<info>Scanning for icons...</info>');
        $scannedIcons = $scanner->scan(
            $config->getScanDirs(),
            $config->getExcludedPatterns()
        );
        $allIcons = array_unique(
            array_merge($scannedIcons, $config->getIncludedIcons())
        );
        sort($allIcons);

        if (empty($allIcons)) {
            $output->writeln(
                '<comment>No icons found in templates.</comment>'
            );
            return 0;
        }

        $output->writeln(sprintf(
            'Found <info>%d</info> icon(s):',
            count($allIcons)
        ));

        foreach ($allIcons as $icon) {
            $marker = $storage->has($icon) ? '✓' : '↓';
            $output->writeln(sprintf('  %s %s', $marker, $icon));
        }

        // Dry-run: stop here
        if ($input->getOption('dry-run')) {
            return 0;
        }

        // Determine which icons need fetching
        $toFetch = array_filter(
            $allIcons,
            fn (string $icon) => !$storage->has($icon)
        );

        if (!empty($toFetch)) {
            $output->writeln(sprintf(
                "\n<info>Fetching %d new icon(s)...</info>",
                count($toFetch)
            ));

            $svgs = $fetcher->fetch($toFetch);
            $saved = $storage->save($svgs);

            $output->writeln(sprintf(
                'Saved <info>%d</info> icon(s) to <comment>%s</comment>',
                $saved,
                $config->getOutputDir()
            ));

            // Report failures
            $failed = array_diff($toFetch, array_keys($svgs));
            foreach ($failed as $icon) {
                $output->writeln(sprintf(
                    '<error>Failed to fetch: %s</error>',
                    $icon
                ));
            }
        } else {
            $output->writeln(
                "\n<info>All icons are already up to date.</info>"
            );
        }

        // Prune unused icons
        if ($input->getOption('prune')) {
            $removed = $storage->prune($allIcons);
            if (!empty($removed)) {
                $output->writeln(sprintf(
                    "\n<info>Pruned %d unused icon(s):</info>",
                    count($removed)
                ));
                foreach ($removed as $icon) {
                    $output->writeln(sprintf('  ✗ %s', $icon));
                }
            }
        }

        return 0;
    }
}
