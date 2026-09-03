# syntax=docker/dockerfile:1

# The Symfony app reads its Twig templates, its SVG sprites and the built
# documentation from sibling packages, resolved relative to `packages/api`.
# Every stage keeps the repository layout under /app so those relative paths
# hold in the final image.

# ---------------------------------------------------------------------------
# Documentation and playground bundles.
# ---------------------------------------------------------------------------
FROM node:24-alpine AS assets

# `@studiometa/ui` copies its Twig templates into `dist/` with rsync, and
# VitePress reads the last-updated date of each page from git.
RUN apk add --no-cache git rsync

# The docs build never opens a browser; skip the browser download the
# `playwright` workspace dependency would otherwise run on install.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

COPY . .

RUN npm ci --no-audit --no-fund

# Builds `@studiometa/ui`, then the playground bundle and the VitePress site.
# The docs `postbuild` symlinks `dist/api` to the Symfony front controller.
RUN npm run build
RUN npm run docs:build

# ---------------------------------------------------------------------------
# PHP dependencies and the warmed production cache.
# ---------------------------------------------------------------------------
FROM php:8.3-cli-alpine AS vendor

COPY --from=composer/composer:2-bin /composer /usr/local/bin/composer

RUN apk add --no-cache git unzip

# Composer runs `cache:clear` and `assets:install` after installing, so the
# cache the runtime stage ships is already compiled for this environment.
ENV APP_ENV=prod
ENV APP_DEBUG=0

WORKDIR /app

# Booting the kernel needs the packages the app reads through relative paths:
# the Twig extension it autoloads, and the template and SVG trees it warms.
COPY packages/twig-extension ./packages/twig-extension
COPY packages/ui/src ./packages/ui/src
COPY packages/api ./packages/api

WORKDIR /app/packages/api

# `APP_SECRET` is a placeholder for the console commands Composer runs: Symfony
# stores `%env(APP_SECRET)%` as a placeholder in the compiled container and
# reads the real value from the environment on the first request.
RUN APP_SECRET=build composer install --no-dev --optimize-autoloader --no-interaction --no-progress \
    && composer clear-cache

# ---------------------------------------------------------------------------
# Runtime.
# ---------------------------------------------------------------------------
FROM php:8.3-fpm-alpine AS runtime

RUN apk add --no-cache nginx

# `opcache` keeps the compiled front controller and the compiled container in
# memory between requests.
RUN docker-php-ext-install opcache
COPY docker/php.ini /usr/local/etc/php/conf.d/app.ini

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY .ddev/nginx/prod-*.conf /etc/nginx/fragments/
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

WORKDIR /app

COPY --from=vendor /app/packages/api ./packages/api
COPY --from=vendor /app/packages/twig-extension ./packages/twig-extension
COPY --from=vendor /app/packages/ui/src ./packages/ui/src
COPY --from=assets /app/packages/docs/.vitepress/dist ./packages/docs/.vitepress/dist

ENV APP_ENV=prod
ENV APP_DEBUG=0

EXPOSE 8080

CMD ["entrypoint"]
