import * as path from 'node:path';
import { defineConfig } from '@studiometa/webpack-config';
import { prototyping } from '@studiometa/webpack-config-preset-prototyping';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

/**
 * Inline source preset.
 * @returns {import('@studiometa/webpack-config/presets').Preset}
 */
function htmlWebpackScriptTypeModule() {
  return {
    name: 'html-webpack-script-type-module',
    handler(config, { extendWebpack }) {
      return extendWebpack(config, (webpackConfig) => {
        webpackConfig.plugins = webpackConfig.plugins.map((plugin) => {
          if (plugin.constructor.name === 'HtmlWebpackPlugin') {
            plugin.userOptions.scriptLoading = 'module';
          }
          return plugin;
        });
      });
    },
  };
}

/**
 * Preset to load Monaco editor helpers: loader, plugin, etc.
 * @returns {import('@studiometa/webpack-config/presets').Preset}
 */
function monaco() {
  return {
    name: 'monaco',
    handler(config, { extendWebpack }) {
      return extendWebpack(config, (webpackConfig) => {
        // Make sure the monaco editor ESM files are treated as ESM
        webpackConfig.module.rules.push({
          test: /monaco-editor\/esm\/vs\/.*\.js$/,
          type: 'javascript/esm',
        });

        webpackConfig.plugins.push(
          new MonacoWebpackPlugin({
            filename: '[name].worker.[contenthash].js',
          }),
        );
      });
    },
  };
}

export default defineConfig({
  presets: [prototyping({ ts: true }), htmlWebpackScriptTypeModule(), monaco()],
  webpackProd(config) {
    config.output.scriptType = 'module';
    config.output.iife = false;
    config.output.module = true;
    config.experiments.outputModule = true;
    config.output.publicPath = '/play-assets/';
    config.output.path = path.resolve('../docs/.symfony/public/play-assets/');
  },
});
