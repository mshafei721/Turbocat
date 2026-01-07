/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
  ],
  // Exclude test setup and mock files from being treated as tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/setup\\.ts$',
    '/__tests__/mocks/',
    '/__tests__/helpers/',
    '/__tests__/factories/',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Transform ESM packages
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid)/)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts', // Exclude barrel exports
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'text-summary'],

  // Coverage thresholds - target 80% overall
  // Note: These thresholds are goals. Start with lower values and increase as coverage improves.
  // Currently disabled until more tests are written (Task Groups 23-25)
  // Uncomment when ready to enforce:
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80,
  //   },
  // },

  verbose: true,
  testTimeout: 30000,

  // Setup file that runs before each test file
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // Module path aliases and mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uuid$': '<rootDir>/src/__tests__/mocks/uuid.ts',
  },

  // Clear mocks between tests for isolation
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Detect open handles (useful for debugging async issues)
  detectOpenHandles: true,

  // Force exit after tests complete (prevents hanging)
  forceExit: true,

  // Global setup/teardown (for integration tests)
  // globalSetup: '<rootDir>/src/__tests__/globalSetup.ts',
  // globalTeardown: '<rootDir>/src/__tests__/globalTeardown.ts',
};
