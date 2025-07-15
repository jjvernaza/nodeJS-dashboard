module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
      '**/__tests__/**/*.js',
      '**/?(*.)+(spec|test).js'
    ],
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/index.js',
      '!src/config/**',
      '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html']
  };