FROM node:16-alpine AS install
WORKDIR /app
RUN apk add git
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY packages/docs/package.json ./packages/docs/package.json
COPY packages/playground/package.json ./packages/playground/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY patches ./patches
RUN npm install --no-audit --no-fund

FROM node:16-alpine AS docs_builder
WORKDIR /app
RUN apk add git
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY packages/docs/ ./packages/docs/
COPY packages/ui/ ./packages/ui/
COPY --from=install /app/node_modules ./node_modules
RUN npm run docs:build

FROM node:16-alpine AS playground_builder
WORKDIR /app
RUN apk add git
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY packages/playground/ ./packages/playground/
COPY packages/ui/ ./packages/ui/
COPY --from=install /app/node_modules ./node_modules
RUN npm run play:build

FROM webdevops/php-apache:7.4-alpine

# Install Puppeteer
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  nodejs \
  npm

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Puppeteer v13.5.0 works with Chromium 100.
RUN npm install -g puppeteer@latest

WORKDIR /app
COPY packages/docs/.symfony/ packages/docs/.symfony/
COPY packages/ui/ packages/ui/
COPY packages/twig-extension/ packages/twig-extension/
RUN composer install -d packages/docs/.symfony
RUN echo "APP_ENV=prod" > packages/docs/.symfony/.env.local
RUN echo "Header set Access-Control-Allow-Origin: https://ui-playground.pages.dev" >> packages/docs/.symfony/public/.htaccess
COPY --from=docs_builder /app/packages/docs/.symfony/public/-/ packages/docs/.symfony/public/-/
COPY --from=playground_builder /app/packages/docs/.symfony/public/play-assets/ packages/docs/.symfony/public/play-assets/
RUN chown -R application:application packages/docs/.symfony
ENV WEB_DOCUMENT_ROOT="/app/packages/docs/.symfony/public/"
