/**
 * @see https://jestjs.io/docs/en/configuration.html
 * @type {import('@jest/types').Config.GlobalConfig}
 */
export default {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    pretendToBeVisual: true,
  },
  collectCoverage: false,
  collectCoverageFrom: ['<rootDir>/ui/**/*.js', '<rootDir>/ui/**/*.ts'],
  rootDir: '..',
  transform: {
    '^.+\\.ts$': ['esbuild-jest', { format: 'esm', sourcemap: true }],
    '^.+\\.html?$': 'html-loader-jest',
  },
  extensionsToTreatAsEsm: ['.ts'],
  resolver: 'ts-jest-resolver',
  moduleNameMapper: {
    '^@studiometa/ui$': '<rootDir>/ui',
    '^@studiometa/ui/(.*)': '<rootDir>/ui$1',
  },
  globals: {
    __DEV__: true,
  },
};
