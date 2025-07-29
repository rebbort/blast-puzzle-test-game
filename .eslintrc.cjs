// ESLint configuration with TypeScript support
// - Parses TypeScript files using @typescript-eslint/parser
// - Applies recommended rules from ESLint and the TypeScript plugin
module.exports = {
  parser: '@typescript-eslint/parser', // Specify TypeScript parser
  plugins: ['@typescript-eslint'], // Enable TypeScript-specific linting rules
  extends: [
    'eslint:recommended', // Base ESLint recommended rules
    'plugin:@typescript-eslint/recommended', // Rules recommended by TS plugin
  ],
};
