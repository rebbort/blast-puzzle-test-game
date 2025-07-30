/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use ts-jest preset to transpile TypeScript files
  preset: 'ts-jest',
  // Run tests in Node environment
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupGlobals.ts'],
};
