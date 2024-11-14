FROM node:22-slim AS install
WORKDIR /app
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
COPY ./packages/docs/package.json ./packages/docs/package.json
COPY ./packages/playground/package.json ./packages/playground/package.json
COPY ./packages/ui/package.json ./packages/ui/package.json
COPY ./packages/tests/package.json ./packages/tests/package.json
COPY ./patches ./patches
RUN npm install --no-audit --no-fund

FROM node:22-slim AS docs_builder
WORKDIR /app
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
COPY ./packages/playground/ ./packages/playground/
COPY ./packages/docs/ ./packages/docs/
COPY ./packages/ui/ ./packages/ui/
COPY --from=install /app/node_modules ./node_modules
RUN apt update && apt install git -y
RUN npm run docs:build

FROM serversideup/php:8.3-fpm-nginx
WORKDIR /app
USER root
COPY packages/docs/.symfony/ ./packages/docs/.symfony/
COPY packages/ui/ ./packages/ui/
COPY packages/twig-extension/ ./packages/twig-extension/
RUN composer install -d ./packages/docs/.symfony
RUN echo "APP_ENV=prod" > ./packages/docs/.symfony/.env.local
RUN echo 'DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"' >> ./packages/docs/.symfony/.env.local
COPY --from=docs_builder /app/packages/docs/.symfony/public/-/ ./packages/docs/.symfony/public/-/
RUN chown -R www-data:www-data .
ENV NGINX_WEBROOT="/app/packages/docs/.symfony/public/"
ENV PHP_OPCACHE_ENABLE=1
USER www-data
