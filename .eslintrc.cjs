const path = require('path');

module.exports = {
  extends: '@studiometa/eslint-config',
  rules: {
    'import/extensions': ['error', 'always', { ignorePackages: true }],
    'no-underscore-dangle': 'off',
  },
  overrides: [
    {
      files: ['**/*.spec.js', '**/spec.js', 'packages/tests/**/*.js'],
      extends: ['plugin:jest/recommended', 'plugin:jest/style'],
      rules: {
        'max-classes-per-file': 'off',
        'jest/no-test-callback': 'off',
        'require-jsdoc': 'off',
        'no-new': 'off',
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    },
    {
      files: ['packages/ui/**/*.js'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { packageDir: path.join(__dirname, 'packages/ui') },
        ],
      },
    },
  ],
};
