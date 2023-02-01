const path = require('path');

module.exports = {
  extends: '@studiometa/eslint-config',
  rules: {
    'import/extensions': ['error', 'always', { ignorePackages: true }],
    'no-underscore-dangle': 'off',
    'import/no-relative-packages': 'off',
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
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/brace-style': 'off',
        'import/extensions': 'off',
        'import/prefer-default-export': 'off',
        'jsdoc/require-param': 'off',
        'jsdoc/require-returns': 'off',
        'object-curly-newline': 'off',
        'require-jsdoc': 'off',
      },
    },
    {
      files: ['packages/ui/**/*.ts'],
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    {
      files: ['packages/playground/src/js/**/*.ts'],
      parserOptions: {
        project: './packages/playground/tsconfig.json',
      },
    },
    {
      files: ['packages/ui/**/*.js', 'packages/ui/**/*.ts'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { packageDir: path.join(__dirname, 'packages/ui') },
        ],
      },
    },
  ],
};
