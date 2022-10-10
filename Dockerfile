FROM node:16-alpine AS builder
WORKDIR /app
COPY . ./
RUN apk add git
RUN npm install --no-audit --no-fund
RUN npm run docs:build

FROM webdevops/php-apache:7.4-alpine
WORKDIR /app
COPY . ./
RUN composer install -d packages/docs/.symfony/
COPY --from=builder /app/packages/docs/.symfony/public/-/ ./packages/docs/.symfony/public/-/
ENV WEB_DOCUMENT_ROOT="/app/packages/docs/.symfony/public/"
