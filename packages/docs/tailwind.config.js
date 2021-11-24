const path = require('path');
const fs = require('fs');

const ui = path.resolve(__dirname, '../ui');
const folders = fs
  .readdirSync(ui, { withFileTypes: true })
  .filter((item) => item.isDirectory() && item.name !== 'node_modules')
  .map((item) => path.resolve(ui, item.name, '**/*.{js,yml,twig,vue}'));

module.exports = {
  mode: 'jit',
  purge: folders,
};
