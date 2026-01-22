module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testMatch: [
      '**/__tests__/**/*.js',
      '**/?(*.)+(spec|test).js'
    ],
    collectCoverageFrom: [
      'controllers/**/*.js',
      'models/**/*.js',
      'routes/**/*.js',
      'middlewares/**/*.js',
      'utils/**/*.js',
      '!index.js',
      '!config/**',
      '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
    testTimeout: 10000
};