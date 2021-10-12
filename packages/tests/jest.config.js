/**
 * @link https://jestjs.io/docs/en/configuration.html
 * @type {import('@jest/types').Config.GlobalConfig}
 */
export default {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    pretendToBeVisual: true,
  },
  collectCoverage: false,
  collectCoverageFrom: ['<rootDir>/ui/**/*.js'],
  rootDir: '..',
  transform: {
    '^.+\\.html?$': 'html-loader-jest',
  },
  globals: {
    __DEV__: true,
  },
};
