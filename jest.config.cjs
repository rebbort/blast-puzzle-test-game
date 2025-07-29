/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use ts-jest preset to transpile TypeScript files
  preset: 'ts-jest',
  // Run tests in Node environment
  testEnvironment: 'node',
  // Redirect imports of the cocos Vec2 module to a local stub
  moduleNameMapper: {
    '^cc$': '<rootDir>/tests/cc.ts',
  },
};
