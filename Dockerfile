FROM node:16-alpine AS builder
WORKDIR /app
COPY . ./
RUN apk add git
RUN npm install --no-audit --no-fund
RUN npm run docs:build
RUN npm run play:build

FROM webdevops/php-apache:7.4-alpine
WORKDIR /app
COPY . ./

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
RUN npm install -g puppeteer@13.5.0

RUN composer install -d packages/docs/.symfony/
RUN echo "APP_ENV=prod" > packages/docs/.symfony/.env.local
RUN echo "Header set Access-Control-Allow-Origin: https://ui-playground.pages.dev" >> packages/docs/.symfony/public/.htaccess
COPY --from=builder /app/packages/docs/.symfony/public/-/ ./packages/docs/.symfony/public/-/
COPY --from=builder /app/packages/docs/.symfony/public/play-assets/ ./packages/docs/.symfony/public/play-assets/
RUN chown -R application:application packages/docs/.symfony
ENV WEB_DOCUMENT_ROOT="/app/packages/docs/.symfony/public/"
