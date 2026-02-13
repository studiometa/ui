<?php

namespace Studiometa\Ui\Composer;

use Composer\Composer;
use Composer\EventDispatcher\EventSubscriberInterface;
use Composer\IO\IOInterface;
use Composer\Plugin\Capability\CommandProvider;
use Composer\Plugin\Capable;
use Composer\Plugin\PluginInterface;
use Composer\Script\Event;
use Composer\Script\ScriptEvents;

/**
 * Composer plugin for build-time icon fetching.
 *
 * Automatically syncs icons from the Iconify API on `composer install`
 * and `composer update`. Existing projects using iconify/json will
 * continue to work as before — local files are simply checked first.
 */
class Plugin implements PluginInterface, EventSubscriberInterface, Capable
{
    private Composer $composer;

    private IOInterface $io;

    public function activate(Composer $composer, IOInterface $io): void
    {
        $this->composer = $composer;
        $this->io = $io;
    }

    public function deactivate(Composer $composer, IOInterface $io): void
    {
        // Nothing to do.
    }

    public function uninstall(Composer $composer, IOInterface $io): void
    {
        // Nothing to do.
    }

    /**
     * {@inheritdoc}
     */
    public static function getSubscribedEvents(): array
    {
        return [
            ScriptEvents::POST_INSTALL_CMD => 'syncIcons',
            ScriptEvents::POST_UPDATE_CMD => 'syncIcons',
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function getCapabilities(): array
    {
        return [
            CommandProvider::class => PluginCommandProvider::class,
        ];
    }

    /**
     * Sync icons after install/update.
     */
    public function syncIcons(Event $event): void
    {
        $config = new Config($this->composer);

        if (!$config->isEnabled()) {
            return;
        }

        $scanner = new IconScanner();
        $fetcher = new IconFetcher($config->getApiUrl());
        $storage = new IconStorage($config->getOutputDir());

        // Scan for icons
        $scanDirs = $config->getScanDirs();
        $scannedIcons = $scanner->scan(
            $scanDirs,
            $config->getExcludedPatterns()
        );
        $allIcons = array_unique(
            array_merge($scannedIcons, $config->getIncludedIcons())
        );
        sort($allIcons);

        if (empty($allIcons)) {
            $this->io->write(
                '<info>[studiometa/ui]</info> No icons found in templates.'
            );
            return;
        }

        // Determine which icons need fetching
        $toFetch = array_filter(
            $allIcons,
            fn (string $icon) => !$storage->has($icon)
        );

        if (empty($toFetch)) {
            $this->io->write(sprintf(
                '<info>[studiometa/ui]</info> All %d icon(s) up to date.',
                count($allIcons)
            ));
            return;
        }

        $this->io->write(sprintf(
            '<info>[studiometa/ui]</info> Fetching %d icon(s)...',
            count($toFetch)
        ));

        $svgs = $fetcher->fetch($toFetch);
        $saved = $storage->save($svgs);

        $this->io->write(sprintf(
            '<info>[studiometa/ui]</info> Saved %d icon(s) to %s',
            $saved,
            $config->getOutputDir()
        ));

        // Report failures
        $failed = array_diff($toFetch, array_keys($svgs));
        foreach ($failed as $icon) {
            $this->io->writeError(sprintf(
                '<warning>[studiometa/ui]</warning> Could not fetch: %s',
                $icon
            ));
        }
    }
}
