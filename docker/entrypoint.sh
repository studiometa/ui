#!/bin/sh
# Starts PHP-FPM and nginx and keeps the container alive for exactly as long as
# both of them run.
set -eu

APP_DIR=/app/packages/api

# Symfony writes its compiled container, its Twig cache and its logs here at
# runtime, under the PHP-FPM user.
mkdir -p "$APP_DIR/var/cache" "$APP_DIR/var/log"
chown -R www-data:www-data "$APP_DIR/var"

php-fpm --nodaemonize &
fpm_pid=$!

nginx -g 'daemon off;' &
nginx_pid=$!

stop() {
    kill -TERM "$fpm_pid" "$nginx_pid" 2>/dev/null || true
}

# The PHP-FPM base image asks for SIGQUIT on stop, container platforms send
# SIGINT or SIGTERM; all three mean the same thing here.
trap stop TERM INT QUIT

# Either process dying makes the whole container exit, so the platform restarts
# a machine that can no longer serve requests instead of one that answers with
# 502s.
while kill -0 "$fpm_pid" 2>/dev/null && kill -0 "$nginx_pid" 2>/dev/null; do
    sleep 1
done

stop
wait "$fpm_pid" "$nginx_pid" 2>/dev/null || true
