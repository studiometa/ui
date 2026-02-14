<?php

use Studiometa\Ui\Composer\PluginCommandProvider;
use Studiometa\Ui\Composer\IconSyncCommand;
use Studiometa\Ui\Composer\IconPruneCommand;

test('it provides the icon sync and prune commands', function () {
    $provider = new PluginCommandProvider();
    $commands = $provider->getCommands();

    expect($commands)->toHaveCount(2);
    expect($commands[0])->toBeInstanceOf(IconSyncCommand::class);
    expect($commands[1])->toBeInstanceOf(IconPruneCommand::class);
});
